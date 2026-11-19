
import { DuckDBInstance } from "@duckdb/node-api";
import { parse } from "csv-parse/sync";
import { randomUUID } from "node:crypto";
import { compileAnalysisSQL } from "./sqlCompiler.js";
let instancePromise = DuckDBInstance.create(":memory:");
let currentDataset = null;

async function getConnection() {
    const instance = await instancePromise;
    return instance.connect();
}


async function query(sql) {
    const connection = await getConnection();

    try {
        const result = await connection.run(sql);

        const rows = await result.getRowObjects();

        return Array.from(rows).map((row) =>
            Object.fromEntries(
                Object.entries(row).map(([key, value]) => [
                    key,
                    typeof value === "bigint"
                        ? Number(value)
                        : value,
                ])
            )
        );
    } finally {
        connection.closeSync();
    }
}


function detectType(values) {
    const filled = values.filter(
        (value) => value !== null && value !== ""
    );

    if (filled.length === 0) return "VARCHAR";

    return filled.every((value) =>
        Number.isFinite(Number(value))
    )
        ? "DOUBLE"
        : "VARCHAR";
}

export async function importDataset(file) {
    let records;

    try {
        records = parse(file.buffer.toString("utf8"), {
            bom: true,
            skip_empty_lines: true,
            trim: true,
            relax_column_count: false,
        });
    } catch {
        const error = new Error("Invalid CSV file.");
        error.status = 400;
        throw error;
    }

    if (records.length < 2) {
        const error = new Error(
            "CSV must have headers and at least one data row."
        );
        error.status = 400;
        throw error;
    }

    const headers = records[0];
    const rows = records.slice(1);

    if (
        headers.length === 0 ||
        headers.length > 50 ||
        headers.some((header) => !header) ||
        new Set(headers).size !== headers.length
    ) {
        const error = new Error(
            "CSV needs 1–50 unique, non-empty column names."
        );
        error.status = 400;
        throw error;
    }

    if (rows.length > 2000) {
        const error = new Error("Maximum 2000 rows allowed.");
        error.status = 400;
        throw error;
    }

    const columns = headers.map((name, index) => ({
        name,
        sqlName: `col_${index}`,
        type: detectType(rows.map((row) => row[index])),
    }));

    const connection = await getConnection();

    try {
        await connection.run("DROP TABLE IF EXISTS uploaded_data");

        const definitions = columns
            .map((column) => `"${column.sqlName}" ${column.type}`)
            .join(", ");

        await connection.run(
            `CREATE TABLE uploaded_data (${definitions})`
        );

        // Insert rows using safely escaped SQL literals.
        for (const row of rows) {
            const values = row.map((value, index) => {
                if (value === "") return "NULL";

                if (columns[index].type === "DOUBLE") {
                    return String(Number(value));
                }

                return `'${String(value).replaceAll("'", "''")}'`;
            });

            await connection.run(
                `INSERT INTO uploaded_data VALUES (${values.join(", ")})`
            );
        }

        currentDataset = {
            id: randomUUID(),
            name: file.originalname,
            rowCount: rows.length,
            columns,
        };

        return currentDataset;
    } finally {
        connection.closeSync();
    }
}

export function getCurrentDataset(id) {
    if (!currentDataset || currentDataset.id !== id) {
        const error = new Error("Dataset not found.");
        error.status = 404;
        throw error;
    }

    return currentDataset;
}



export async function getDatasetPreview(id) {
    const dataset = getCurrentDataset(id);

    const rows = await query(
        "SELECT * FROM uploaded_data LIMIT 10"
    );



    return {
        ...dataset,
        preview: rows.map((row) => {
            const item = {};

            for (const column of dataset.columns) {
                item[column.name] = row[column.sqlName] ?? null;
            }

            return item;
        }),
    };
}


export async function analyzeDataset(id) {
    const dataset = getCurrentDataset(id);

    const numericColumns = dataset.columns.filter(
        (column) => column.type === "DOUBLE"
    );

    const textColumns = dataset.columns.filter(
        (column) => column.type === "VARCHAR"
    );

    const measure =
        numericColumns.find((column) =>
            /revenue|sales|amount|total|price/i.test(
                column.name
            )
        ) || numericColumns[0];

    const dimension =
        textColumns.find((column) =>
            /product|category|region|city|name/i.test(
                column.name
            )
        ) || textColumns[0];

    if (!measure) {
        return {
            dataset,
            stats: {
                rowCount: dataset.rowCount,
                columnCount: dataset.columns.length,
                total: null,
                average: null,
            },
            chart: [],
            measure: null,
            dimension: null,
        };
    }

    const summary = await query(`
    SELECT
      SUM("${measure.sqlName}") AS total,
      AVG("${measure.sqlName}") AS average
    FROM uploaded_data
  `);

    let chart = [];

    if (dimension) {
        chart = await query(`
      SELECT
        COALESCE("${dimension.sqlName}", 'Unknown') AS label,
        SUM("${measure.sqlName}") AS value
      FROM uploaded_data
      GROUP BY 1
      ORDER BY value DESC
      LIMIT 10
    `);
    }

    return {
        dataset,
        stats: {
            rowCount: dataset.rowCount,
            columnCount: dataset.columns.length,
            total: summary[0]?.total ?? null,
            average: summary[0]?.average ?? null,
        },
        chart,
        measure: measure.name,
        dimension: dimension?.name ?? null,
    };
}


export async function runAIAnalysis(datasetId, plan) {
    const dataset = getCurrentDataset(datasetId);

    if (!dataset) {
        throw Object.assign(
            new Error("Dataset not found. Please upload your CSV again."),
            { status: 404 }
        );
    }

    const compiled = compileAnalysisSQL(
        plan,
        dataset.columns
    );

    // Reuse the existing DuckDB query helper.
    const rows = await query(compiled.sql);

    // Convert DuckDB values into JSON-safe values.
    const safeRows = Array.from(rows).map((row) => {
        const result = {};

        for (const [key, value] of Object.entries(row)) {
            result[key] =
                typeof value === "bigint"
                    ? Number(value)
                    : value;
        }

        return result;
    });

    return {
        ...compiled,
        rows: safeRows,
    };
}

