
export function selectChartType(question, analysis) {
    const text = question.toLowerCase();

    if (!analysis.dimension || analysis.rows.length === 0) {
        return "none";
    }

    if (/\b(pie|donut|doughnut)\b/.test(text)) {
        return "pie";
    }

    if (/\b(line|trend|over time|timeline)\b/.test(text)) {
        return "line";
    }

    if (/\b(bar|column)\b/.test(text)) {
        return "bar";
    }

    const dimension = analysis.dimension.toLowerCase();

    if (/date|month|year|time|day|week/.test(dimension)) {
        return "line";
    }

    const values = analysis.rows.map((row) =>
        Number(row.value)
    );

    const total = values.reduce(
        (sum, value) => sum + value,
        0
    );

    if (
        analysis.rows.length >= 2 &&
        analysis.rows.length <= 5 &&
        values.every((value) =>
            Number.isFinite(value) && value >= 0
        ) &&
        total > 0 &&
        /\b(share|distribution|proportion|percentage|breakdown)\b/.test(text)
    ) {
        return "pie";
    }

    return "bar";
}
