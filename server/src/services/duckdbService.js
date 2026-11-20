
import { DuckDBInstance } from "@duckdb/node-api";
import { parse } from "csv-parse/sync";
import ExcelJS from "exceljs";
import { randomUUID } from "node:crypto";
import { compileAnalysisSQL } from "./sqlCompiler.js";
import fs from "node:fs";
import path from "node:path";

const dataDirectory = path.resolve("data");

fs.mkdirSync(dataDirectory, { recursive: true });

const databasePath = path.join(
    dataDirectory,
    "datapilot.duckdb"
);

const instancePromise = DuckDBInstance.create(databasePath);

const datasets = new Map();

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
                        ? Number.isSafeInteger(Number(value))
                            ? Number(value)
                            : value.toString()
                        : value,
                ])
            )
        );
    } finally {
        connection.closeSync();
    }
}
let initializationPromise;

async function initializeDatabase() {
    if (!initializationPromise) {
        initializationPromise = (async () => {
            await query(`
        CREATE TABLE IF NOT EXISTS datasets (
          id VARCHAR PRIMARY KEY,
          name VARCHAR NOT NULL,
          table_name VARCHAR NOT NULL,
          row_count BIGINT NOT NULL,
          columns_json VARCHAR NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
        })();
    }

    return initializationPromise;
}

function tableNameFor(id) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
        throw Object.assign(
            new Error("Invalid dataset ID."),
            { status: 400 }
        );
    }

    return `dataset_${id.replaceAll("-", "")}`;
}

async function parseExcelFile(buffer) {
    const workbook = new ExcelJS.Workbook();

    try {
        await workbook.xlsx.load(buffer);
    } catch {
        const error = new Error("Invalid Excel (.xlsx) file.");
        error.status = 400;
        throw error;
    }

    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
        const error = new Error("Excel file contains no worksheets.");
        error.status = 400;
        throw error;
    }

    const records = [];

    worksheet.eachRow({ includeEmpty: true }, (row) => {
        const values = [];

        for (let index = 1; index <= worksheet.columnCount; index++) {
            const cell = row.getCell(index);
            let value = cell.value;

            if (value === null || value === undefined) {
                value = "";
            } else if (typeof value === "object") {
                if (value instanceof Date) {
                    value = value.toISOString();
                } else if ("result" in value) {
                    value = value.result ?? "";
                } else if ("text" in value) {
                    value = value.text ?? "";
                } else if ("richText" in value) {
                    value = value.richText
                        .map((part) => part.text)
                        .join("");
                } else {
                    value = String(value);
                }
            }

            values.push(String(value).trim());
        }

        records.push(values);
    });

    return records;
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
    await initializeDatabase();

    let records;

    const extension = file.originalname
        .split(".")
        .pop()
        ?.toLowerCase();

    if (extension === "xlsx") {
        records = await parseExcelFile(file.buffer);
    } else if (extension === "csv") {
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
    } else {
        const error = new Error(
            "Only CSV and Excel (.xlsx) files are supported."
        );
        error.status = 400;
        throw error;
    }

    if (records.length < 2) {
        throw Object.assign(
            new Error("CSV must contain headers and data rows."),
            { status: 400 }
        );
    }

    const headers = records[0];
    const rows = records.slice(1);

    if (extension === "xlsx") {
        for (const row of rows) {
            while (row.length < headers.length) {
                row.push("");
            }

            if (row.length > headers.length) {
                const error = new Error(
                    "Excel rows must match the header column count."
                );
                error.status = 400;
                throw error;
            }
        }
    }

    if (
        headers.length === 0 ||
        headers.length > 50 ||
        headers.some((header) => !header) ||
        new Set(headers).size !== headers.length
    ) {
        throw Object.assign(
            new Error("CSV requires 1–50 unique column names."),
            { status: 400 }
        );
    }

    if (rows.length > 2000) {
        throw Object.assign(
            new Error("Maximum 2000 rows allowed."),
            { status: 400 }
        );
    }

    const columns = headers.map((name, index) => ({
        name,
        sqlName: `col_${index}`,
        type: detectType(rows.map((row) => row[index])),
    }));

    const id = randomUUID();
    const tableName = tableNameFor(id);

    const connection = await getConnection();

    try {
        await connection.run("BEGIN TRANSACTION");

        const definitions = columns
            .map((column) =>
                `"${column.sqlName}" ${column.type}`
            )
            .join(", ");

        await connection.run(
            `CREATE TABLE "${tableName}" (${definitions})`
        );

        for (const row of rows) {
            const values = row.map((value, index) => {
                if (value === "") return "NULL";

                if (columns[index].type === "DOUBLE") {
                    return String(Number(value));
                }

                return `'${String(value).replaceAll("'", "''")}'`;
            });

            await connection.run(
                `INSERT INTO "${tableName}" VALUES (${values.join(", ")})`
            );
        }

        const safeName = file.originalname.replaceAll("'", "''");
        const columnsJSON = JSON.stringify(columns).replaceAll("'", "''");

        await connection.run(`
      INSERT INTO datasets (
        id, name, table_name, row_count, columns_json
      )
      VALUES (
        '${id}',
        '${safeName}',
        '${tableName}',
        ${rows.length},
        '${columnsJSON}'
      )
    `);

        await connection.run("COMMIT");
    } catch (error) {
        await connection.run("ROLLBACK");
        throw error;
    } finally {
        connection.closeSync();
    }

    const dataset = {
        id,
        name: file.originalname,
        rowCount: rows.length,
        columns,
        tableName,
    };

    datasets.set(id, dataset);

    return dataset;
}



export async function getCurrentDataset(id) {
    await initializeDatabase();

    if (typeof id !== "string") {
        throw Object.assign(
            new Error("Invalid dataset ID."),
            { status: 400 }
        );
    }

    if (datasets.has(id)) {
        return datasets.get(id);
    }

    const safeId = id.replaceAll("'", "''");

    const rows = await query(`
    SELECT
      id,
      name,
      table_name,
      row_count,
      columns_json
    FROM datasets
    WHERE id = '${safeId}'
    LIMIT 1
  `);

    if (rows.length === 0) {
        throw Object.assign(
            new Error("Dataset not found."),
            { status: 404 }
        );
    }

    const record = rows[0];

    const dataset = {
        id: record.id,
        name: record.name,
        rowCount: Number(record.row_count),
        columns: JSON.parse(record.columns_json),
        tableName: record.table_name,
    };

    datasets.set(id, dataset);

    return dataset;
}

export async function listDatasets() {
    await initializeDatabase();

    const rows = await query(`
    SELECT
      id,
      name,
      row_count,
      created_at
    FROM datasets
    ORDER BY created_at DESC
  `);

    return rows.map((row) => ({
        id: row.id,
        name: row.name,
        rowCount: Number(row.row_count),
        createdAt: row.created_at,
    }));
}




export async function getDatasetPreview(id) {
    const dataset = await getCurrentDataset(id);

    const rows = await query(
        `SELECT * FROM "${dataset.tableName}" LIMIT 10`
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
    const dataset = await getCurrentDataset(id);
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
    FROM "${dataset.tableName}"
  `);

    let chart = [];

    if (dimension) {
        chart = await query(`
      SELECT
        COALESCE("${dimension.sqlName}", 'Unknown') AS label,
        SUM("${measure.sqlName}") AS value
      FROM "${dataset.tableName}"
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
    const dataset = await getCurrentDataset(datasetId);

    const compiled = compileAnalysisSQL(
        plan,
        dataset.columns,
        dataset.tableName
    );

    const rows = await query(compiled.sql);

    return {
        ...compiled,
        rows,
    };
}


export async function deleteDatasetById(id) {
    await initializeDatabase();

    const dataset = await getCurrentDataset(id);

    const connection = await getConnection();

    try {
        await connection.run("BEGIN TRANSACTION");

        await connection.run(
            `DROP TABLE IF EXISTS "${dataset.tableName}"`
        );

        await connection.run(
            `DELETE FROM datasets WHERE id = '${dataset.id}'`
        );

        await connection.run("COMMIT");

        datasets.delete(id);

        return { id, deleted: true };
    } catch (error) {
        await connection.run("ROLLBACK");
        throw error;
    } finally {
        connection.closeSync();
    }
}


