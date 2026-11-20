
import { useRef, useState, useEffect } from "react";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
} from "recharts";

import { askDatasetAI } from "../services/api";

const COLORS = [
    "#818cf8",
    "#22c55e",
    "#f59e0b",
    "#ec4899",
    "#06b6d4",
    "#a78bfa",
];

function formatNumber(value) {
    const number = Number(value);

    return Number.isFinite(number)
        ? number.toLocaleString("en-US", {
            maximumFractionDigits: 2,
        })
        : String(value ?? "");
}

function ResultChart({ message }) {
    const data = message.chart || [];

    if (!data.length || message.chartType === "none") {
        return null;
    }

    const chartData = data.map((row) => ({
        label: String(row.label ?? "Unknown"),
        value: Number(row.value),
    })).filter((row) => Number.isFinite(row.value));

    if (!chartData.length) return null;

    const commonAxis = (
        <>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
                dataKey="label"
                stroke="#94a3b8"
                tick={{ fontSize: 11 }}
            />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
        </>
    );

    let chart;

    if (message.chartType === "pie") {
        const pieData = chartData.filter((row) => row.value >= 0);

        if (!pieData.some((row) => row.value > 0)) {
            return null;
        }

        chart = (
            <PieChart>
                <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                    }
                >
                    {pieData.map((row, index) => (
                        <Cell
                            key={`${row.label}-${index}`}
                            fill={COLORS[index % COLORS.length]}
                        />
                    ))}
                </Pie>
                <Tooltip formatter={formatNumber} />
                <Legend />
            </PieChart>
        );
    } else if (message.chartType === "line") {
        chart = (
            <LineChart data={chartData}>
                {commonAxis}
                <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#818cf8"
                    strokeWidth={3}
                    dot
                />
            </LineChart>
        );
    } else {
        chart = (
            <BarChart data={chartData}>
                {commonAxis}
                <Bar
                    dataKey="value"
                    fill="#818cf8"
                    radius={[5, 5, 0, 0]}
                />
            </BarChart>
        );
    }

    return (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <h3 className="mb-4 text-sm font-semibold text-indigo-300">
                {message.chartType.toUpperCase()} CHART
            </h3>

            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    {chart}
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default function DatasetAIChat({ datasetId }) {
    const [question, setQuestion] = useState("");
    const storageKey = `datapilot_chat_${datasetId}`;

    const [messages, setMessages] = useState(() => {
        try {
            const saved = sessionStorage.getItem(storageKey);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const requestInProgress = useRef(false);
    useEffect(() => {
        sessionStorage.setItem(
            storageKey,
            JSON.stringify(messages)
        );
    }, [messages, storageKey]);
    async function handleAsk(event) {
        event.preventDefault();

        const text = question.trim();

        if (!text || requestInProgress.current || !datasetId) return;

        requestInProgress.current = true;

        const history = messages
            .filter((message) =>
                message.role === "assistant" && message.plan
            )
            .slice(-6)
            .map((message) => ({
                question: message.question,
                plan: message.plan,
            }));

        setLoading(true);
        setError("");
        setQuestion("");

        setMessages((previous) => [
            ...previous,
            { role: "user", text },
        ]);

        try {
            const response = await askDatasetAI(
                datasetId,
                text,
                history
            );

            const result = response.data;

            setMessages((previous) => [
                ...previous,
                {
                    role: "assistant",
                    question: text,
                    text: result.reply,
                    sql: result.sql,
                    rows: result.rows,
                    chart: result.chart,
                    chartType: result.chartType,
                    insights: result.insights,
                    plan: result.plan,
                },
            ]);
        } catch (err) {
            setError(
                err.message ||
                "Unable to analyze your dataset. Please try again."
            );

            setQuestion(text);
        } finally {
            requestInProgress.current = false;
            setLoading(false);
        }
    }

    function clearConversation() {
        if (loading) return;

        sessionStorage.removeItem(storageKey);
        setMessages([]);
        setQuestion("");
        setError("");
    }

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">
                        DataPilot AI Copilot
                    </h1>
                    <p className="mt-2 text-slate-400">
                        Ask questions, explore insights, and visualize your data.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={clearConversation}
                    disabled={loading}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                >
                    Clear conversation
                </button>
            </div>

            <div className="rounded-xl border border-indigo-800 bg-indigo-950/30 p-4">
                <p className="text-sm text-indigo-200">
                    Conversational memory is active for this chat.
                    You can ask follow-up questions about your previous analysis.
                </p>
            </div>

            <div className="min-h-96 space-y-5 rounded-2xl border border-slate-700 bg-slate-900 p-5">
                {messages.length === 0 && (
                    <div className="space-y-3 text-slate-400">
                        <p className="font-semibold text-white">
                            Try these questions:
                        </p>
                        <p>Show total revenue by category.</p>
                        <p>What about Accessories only?</p>
                        <p>Show revenue distribution as a pie chart.</p>
                        <p>Which product has the highest revenue?</p>
                    </div>
                )}

                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={
                            message.role === "user"
                                ? "ml-auto max-w-2xl rounded-2xl rounded-tr-sm bg-indigo-600 p-4 text-white shadow-lg"
                                : "max-w-4xl space-y-4 rounded-2xl rounded-tl-sm border border-slate-700 bg-slate-800/80 p-5 text-white shadow-md"
                        }
                    >
                        {message.role === "assistant" && (
                            <p
                                className={
                                    message.role === "user"
                                        ? "mb-2 text-xs font-semibold text-indigo-200"
                                        : "mb-2 text-xs font-semibold text-indigo-300"
                                }
                            >
                                {message.role === "user" ? "You" : "✦ DataPilot AI"}
                            </p>
                        )}

                        <p className="whitespace-pre-wrap">
                            {message.text}
                        </p>

                        {message.insights?.length > 0 && (
                            <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
                                <h3 className="mb-3 font-semibold text-amber-300">
                                    AI Insights
                                </h3>

                                <ul className="list-disc space-y-2 pl-5 text-sm text-slate-300">
                                    {message.insights.map((insight, i) => (
                                        <li key={i}>{insight}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <ResultChart message={message} />

                        {message.rows?.length > 0 && (
                            <div className="overflow-x-auto">
                                <h3 className="mb-2 text-sm font-semibold text-slate-300">
                                    Query Results
                                </h3>

                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-600">
                                            {Object.keys(message.rows[0]).map(
                                                (column) => (
                                                    <th
                                                        key={column}
                                                        className="p-2 text-left"
                                                    >
                                                        {column}
                                                    </th>
                                                )
                                            )}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {message.rows.map((row, rowIndex) => (
                                            <tr
                                                key={rowIndex}
                                                className="border-b border-slate-700"
                                            >
                                                {Object.values(row).map((value, i) => (
                                                    <td key={i} className="p-2">
                                                        {formatNumber(value)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {message.sql && (
                            <details className="rounded-lg bg-slate-950 p-3">
                                <summary className="cursor-pointer text-sm text-indigo-300">
                                    View generated SQL
                                </summary>

                                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-slate-300">
                                    {message.sql}
                                </pre>
                            </details>
                        )}
                    </div>
                ))}

                {loading && (
                    <p className="animate-pulse text-indigo-300">
                        DataPilot AI is analyzing your dataset...
                    </p>
                )}

                {error && (
                    <div
                        role="alert"
                        className="rounded-xl border border-red-800 bg-red-950/50 p-4"
                    >
                        <p className="font-semibold text-red-300">
                            Unable to complete AI analysis
                        </p>

                        <p className="mt-2 text-sm text-red-200">
                            {error}
                        </p>

                        <p className="mt-2 text-xs text-slate-400">
                            Check your question or AI service, then try again.
                        </p>
                    </div>
                )}
            </div>

            <form onSubmit={handleAsk} className="flex gap-3">
                <input
                    value={question}
                    onChange={(event) =>
                        setQuestion(event.target.value)
                    }
                    maxLength={500}
                    disabled={loading || !datasetId}
                    placeholder="Ask DataPilot AI anything about your dataset..."
                    className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                />

                <button
                    type="submit"
                    disabled={loading || !question.trim() || !datasetId}
                    className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                    {loading ? "Thinking..." : "Ask AI"}
                </button>
            </form>
        </div>
    );
}
