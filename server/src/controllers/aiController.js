
import {
    getCurrentDataset,
    runAIAnalysis,
} from "../services/duckdbService.js";

import {
    generateAnalysisPlan,
} from "../services/ollamaService.js";

import {
    selectChartType,
} from "../services/chartService.js";

import {
    generateInsights,
} from "../services/insightService.js";

function formatValue(value) {
    if (value == null) return "N/A";

    if (typeof value === "number") {
        return value.toLocaleString("en-US", {
            maximumFractionDigits: 2,
        });
    }

    return String(value);
}

function buildReply(analysis) {
    const { rows, operation, measure, dimension } = analysis;

    if (!rows.length) {
        return "No matching data was found.";
    }

    const metric =
        operation === "count"
            ? "row count"
            : `${operation} of ${measure}`;

    if (!dimension) {
        return `${metric} is ${formatValue(rows[0].value)}.`;
    }

    const first = rows[0];

    return (
        `The first result is ${formatValue(first.label)}, ` +
        `with ${metric} of ${formatValue(first.value)}. ` +
        `Showing ${rows.length} grouped result(s).`
    );
}

function isChartOnlyQuestion(question) {
    const text = question.trim().toLowerCase();

    return /^(show|display|plot|visualize|make|change|convert|switch|turn|draw)\b.*\b(as|to|into|using|with)\s+(a\s+|an\s+)?(bar|line|pie|donut|doughnut)\s*(chart|graph)?[.!?]*$/.test(text) ||
        /^(bar|line|pie|donut|doughnut)\s*(chart|graph)[.!?]*$/.test(text);
}

function validHistoryItem(item) {
    return (
        item &&
        typeof item.question === "string" &&
        item.question.length <= 500 &&
        item.plan &&
        typeof item.plan === "object" &&
        !Array.isArray(item.plan)
    );
}

export async function askDatasetAI(req, res, next) {
    try {
        const { datasetId, question, history = [] } =
            req.body || {};

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

        if (
            !Array.isArray(history) ||
            history.length > 6 ||
            !history.every(validHistoryItem)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid conversation history.",
            });
        }

        const dataset = getCurrentDataset(datasetId);

        if (!dataset) {
            return res.status(404).json({
                success: false,
                message: "Dataset not found. Upload your CSV again.",
            });
        }

        const previous = history[history.length - 1];

        // A pure chart-style request should reuse the
        // previous query rather than asking Ollama again.
        const plan =
            previous && isChartOnlyQuestion(question)
                ? previous.plan
                : await generateAnalysisPlan(
                    question.trim(),
                    dataset.columns,
                    history
                );

        // Phase 5's compiler validates this plan again.
        const analysis = await runAIAnalysis(datasetId, plan);

        const chartType = selectChartType(question, analysis);

        const insights = generateInsights(analysis);

        return res.json({
            success: true,
            data: {
                question,
                reply: buildReply(analysis),
                sql: analysis.sql,
                rows: analysis.rows,
                chart: analysis.dimension ? analysis.rows : [],
                chartType,
                insights,
                operation: analysis.operation,
                measure: analysis.measure,
                dimension: analysis.dimension,
                filters: analysis.filters,
                plan: {
                    operation: analysis.operation,
                    measure: analysis.measure,
                    dimension: analysis.dimension,
                    filters: analysis.filters,
                    limit: analysis.limit,
                    sort: analysis.sort,
                },
            },
        });
    } catch (error) {
        next(error);
    }
}
