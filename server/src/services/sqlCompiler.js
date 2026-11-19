
const OPERATIONS = {
    sum: "SUM",
    avg: "AVG",
    min: "MIN",
    max: "MAX",
    count: "COUNT",
};

const COMPARISONS = {
    eq: "=",
    neq: "!=",
    gt: ">",
    gte: ">=",
    lt: "<",
    lte: "<=",
};

function invalid(message) {
    throw Object.assign(new Error(message), { status: 422 });
}

function findColumn(columns, name) {
    const column = columns.find((item) => item.name === name);

    if (!column) {
        invalid(`Unknown column: ${String(name)}`);
    }

    // The upload service creates internal names such as col_0.
    // Never use AI-provided SQL identifiers directly.
    if (!/^col_\d+$/.test(column.sqlName || "")) {
        invalid("Dataset has an invalid internal column identifier.");
    }

    return column;
}

function identifier(column) {
    return `"${column.sqlName}"`;
}

function sqlString(value) {
    if (typeof value !== "string" || value.length > 500) {
        invalid("A text filter must be a string of at most 500 characters.");
    }

    return `'${value.replace(/'/g, "''")}'`;
}

function sqlNumber(value) {
    if (
        typeof value !== "number" &&
        !(typeof value === "string" && value.trim() !== "")
    ) {
        invalid("A numeric filter needs a number.");
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        invalid("Invalid numeric filter value.");
    }

    return String(number);
}

function sqlDate(value) {
    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        invalid("Dates must use YYYY-MM-DD format.");
    }

    const date = new Date(`${value}T00:00:00Z`);

    if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value
    ) {
        invalid("Invalid calendar date.");
    }

    return `DATE '${value}'`;
}

function isNumeric(column) {
    return column.type === "DOUBLE";
}

function isDateColumn(column) {
    return /date|time|timestamp/i.test(column.name);
}

function compileFilter(filter, columns) {
    if (
        !filter ||
        typeof filter !== "object" ||
        Array.isArray(filter)
    ) {
        invalid("Invalid filter.");
    }

    const column = findColumn(columns, filter.column);
    const operator = filter.operator;
    const rawColumn = identifier(column);

    if (operator === "contains") {
        if (isNumeric(column)) {
            invalid("Contains requires a text column.");
        }

        // Escape SQL LIKE wildcards so they are treated literally.
        const escaped = String(filter.value ?? "")
            .replace(/\\/g, "\\\\")
            .replace(/%/g, "\\%")
            .replace(/_/g, "\\_");

        return `CAST(${rawColumn} AS VARCHAR) ILIKE '%' || ${sqlString(escaped)} || '%' ESCAPE '\\'`;
    }

    if (operator === "between") {
        if (
            !Array.isArray(filter.value) ||
            filter.value.length !== 2
        ) {
            invalid("Between requires exactly two values.");
        }

        const [start, end] = filter.value;

        if (isNumeric(column)) {
            return `${rawColumn} BETWEEN ${sqlNumber(start)} AND ${sqlNumber(end)}`;
        }

        if (!isDateColumn(column)) {
            invalid("Between requires a numeric or date-like column.");
        }

        return `TRY_CAST(${rawColumn} AS DATE) BETWEEN ${sqlDate(start)} AND ${sqlDate(end)}`;
    }

    const comparison = COMPARISONS[operator];

    if (!comparison) {
        invalid(`Unsupported filter operator: ${String(operator)}`);
    }

    if (isNumeric(column)) {
        return `${rawColumn} ${comparison} ${sqlNumber(filter.value)}`;
    }

    if (
        isDateColumn(column) &&
        typeof filter.value === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(filter.value)
    ) {
        return `TRY_CAST(${rawColumn} AS DATE) ${comparison} ${sqlDate(filter.value)}`;
    }

    if (!["eq", "neq"].includes(operator)) {
        invalid("Text columns support eq, neq, or contains.");
    }

    return `${rawColumn} ${comparison} ${sqlString(filter.value)}`;
}

export function compileAnalysisSQL(plan, columns) {
    if (
        !plan ||
        typeof plan !== "object" ||
        Array.isArray(plan)
    ) {
        invalid("AI returned an invalid analysis plan.");
    }

    const operation = plan.operation;
    const aggregate = OPERATIONS[operation];

    if (!aggregate) {
        invalid("Unsupported analysis operation.");
    }

    if (!Array.isArray(columns) || columns.length === 0) {
        invalid("Dataset has no columns.");
    }

    const measure =
        operation === "count"
            ? null
            : findColumn(columns, plan.measure);

    if (measure && !isNumeric(measure)) {
        invalid("The selected measure must be numeric.");
    }

    const dimension =
        plan.dimension == null
            ? null
            : findColumn(columns, plan.dimension);

    const filters = plan.filters ?? [];

    if (!Array.isArray(filters) || filters.length > 10) {
        invalid("A maximum of 10 filters is supported.");
    }

    const whereParts = filters.map((filter) =>
        compileFilter(filter, columns)
    );

    const whereClause =
        whereParts.length > 0
            ? `WHERE ${whereParts.join(" AND ")}`
            : "";

    const expression =
        operation === "count"
            ? "COUNT(*)"
            : `${aggregate}(${identifier(measure)})`;

    const limit =
        Number.isInteger(plan.limit) &&
            plan.limit >= 1 &&
            plan.limit <= 20
            ? plan.limit
            : 10;

    const sort = plan.sort === "asc" ? "ASC" : "DESC";

    let sql;

    if (dimension) {
        sql = `
      SELECT
        ${identifier(dimension)} AS label,
        ${expression} AS value
      FROM uploaded_data
      ${whereClause}
      GROUP BY ${identifier(dimension)}
      ORDER BY value ${sort} NULLS LAST, label ASC
      LIMIT ${limit}
    `;
    } else {
        sql = `
      SELECT
        ${expression} AS value
      FROM uploaded_data
      ${whereClause}
    `;
    }

    return {
        sql: sql.trim(),
        operation,
        measure: measure?.name ?? null,
        dimension: dimension?.name ?? null,
        filters,
        sort: sort.toLowerCase(),
        limit,
    };
}
