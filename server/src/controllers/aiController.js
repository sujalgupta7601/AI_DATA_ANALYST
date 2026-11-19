
import {
    getCurrentDataset,
    runAIAnalysis,
} from "../services/duckdbService.js";

import {
    generateAnalysisPlan,
} from "../services/ollamaService.js";

export async function askDatasetAI(req, res, next) {
    try {
        const { datasetId, question } = req.body || {};

        if (
            typeof datasetId !== "string" ||
            typeof question !== "string" ||
            !question.trim() ||
            question.length > 500
        ) {
            return res.status(400).json({
                success: false,
                message: "Provide a valid dataset ID and question.",
            });
        }

        const dataset = getCurrentDataset(datasetId);

        if (!dataset) {
            return res.status(404).json({
                success: false,
                message: "Dataset not found. Upload the CSV again.",
            });
        }

        const plan = await generateAnalysisPlan(
            question.trim(),
            dataset.columns
        );

        const analysis = await runAIAnalysis(datasetId, plan);

        const {
            rows,
            operation,
            measure,
            dimension,
            filters,
            sort,
        } = analysis;

        function formatValue(value) {
            if (value == null) return "N/A";

            if (typeof value === "number") {
                return value.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                });
            }

            return String(value);
        }

        const operationLabel = {
            sum: "total",
            avg: "average",
            min: "minimum",
            max: "maximum",
            count: "count",
        };

        const metric =
            operation === "count"
                ? "row count"
                : `${operationLabel[operation]} ${measure}`;

        let reply;

        if (rows.length === 0) {
            reply = "No matching data was found.";
        } else if (dimension) {
            const first = rows[0];

            reply =
                `The first result is ${formatValue(first.label)}, ` +
                `with ${metric} of ${formatValue(first.value)}. ` +
                `Showing ${rows.length} grouped result(s), ` +
                `sorted ${sort === "asc" ? "ascending" : "descending"}.`;
        } else {
            reply = `${metric} is ${formatValue(rows[0].value)}.`;
        }

        if (filters.length > 0) {
            reply += ` Applied ${filters.length} filter(s).`;
        }

        return res.json({
            success: true,
            data: {
                question,
                reply,
                sql: analysis.sql,
                rows,
                chart: dimension ? rows : [],
                operation,
                measure,
                dimension,
                filters,
            },
        });
    } catch (error) {
        next(error);
    }
}
