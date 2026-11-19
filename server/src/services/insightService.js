
function formatNumber(value) {
    if (value == null) return "N/A";

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return String(value);
    }

    return number.toLocaleString("en-US", {
        maximumFractionDigits: 2,
    });
}

export function generateInsights(analysis) {
    const { rows, dimension, measure, operation } = analysis;

    if (!rows || rows.length === 0) {
        return ["No matching data was found."];
    }

    if (!dimension) {
        const value = rows[0]?.value;

        return [
            `${operation === "count" ? "Row count" : `${operation} of ${measure}`}: ${formatNumber(value)}.`,
        ];
    }

    const validRows = rows
        .map((row) => ({
            label: String(row.label ?? "Unknown"),
            value: Number(row.value),
        }))
        .filter((row) => Number.isFinite(row.value));

    if (validRows.length === 0) {
        return ["No numeric results were available."];
    }

    const descending = [...validRows].sort(
        (a, b) => b.value - a.value
    );

    const highest = descending[0];
    const lowest = descending[descending.length - 1];

    const insights = [
        `${highest.label} has the highest ${operation} value: ${formatNumber(highest.value)}.`,
    ];

    if (validRows.length > 1) {
        insights.push(
            `${lowest.label} has the lowest ${operation} value: ${formatNumber(lowest.value)}.`
        );

        const difference = highest.value - lowest.value;

        insights.push(
            `The difference between the highest and lowest displayed values is ${formatNumber(difference)}.`
        );
    }

    if (
        operation === "sum" &&
        validRows.length > 1 &&
        validRows.every((row) => row.value >= 0)
    ) {
        const total = validRows.reduce(
            (sum, row) => sum + row.value,
            0
        );

        if (total > 0) {
            const percentage = (highest.value / total) * 100;

            insights.push(
                `${highest.label} represents ${percentage.toFixed(1)}% of the displayed total.`
            );
        }
    }

    return insights;
}
