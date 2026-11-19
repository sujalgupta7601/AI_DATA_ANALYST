
import { useState } from "react";
import {
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

import { askDatasetAI } from "../services/api";

export default function DatasetAIChat({ datasetId }) {
    const [question, setQuestion] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleAsk(event) {
        event.preventDefault();

        const text = question.trim();

        if (!text || loading) return;

        setLoading(true);
        setError("");
        setQuestion("");

        setMessages((previous) => [
            ...previous,
            { role: "user", text },
        ]);

        try {
            const result = await askDatasetAI(datasetId, text);

            setMessages((previous) => [
                ...previous,
                {
                    role: "assistant",
                    text: result.data.reply,
                    sql: result.data.sql,
                    rows: result.data.rows,
                    chart: result.data.chart,
                },
            ]);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white">
                    AI Data Analyst
                </h1>
                <p className="mt-2 text-slate-400">
                    Ask questions about your uploaded CSV.
                </p>
            </div>

            <div className="min-h-96 space-y-5 rounded-2xl border border-slate-700 bg-slate-900 p-5">
                {messages.length === 0 && (
                    <div className="space-y-3 text-slate-400">
                        <p>Try asking:</p>
                        <p>Which product generated the highest revenue?</p>
                        <p>What is the total revenue?</p>
                        <p>What is the average quantity?</p>
                    </div>
                )}

                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={
                            message.role === "user"
                                ? "ml-auto max-w-2xl rounded-xl bg-indigo-600 p-4 text-white"
                                : "max-w-4xl space-y-4 rounded-xl border border-slate-700 bg-slate-800 p-4 text-white"
                        }
                    >
                        <p className="whitespace-pre-wrap">
                            {message.text}
                        </p>

                        {message.sql && (
                            <details className="rounded-lg bg-slate-950 p-3">
                                <summary className="cursor-pointer text-sm text-indigo-300">
                                    View SQL query
                                </summary>
                                <pre className="mt-3 overflow-x-auto text-xs text-slate-300">
                                    {message.sql}
                                </pre>
                            </details>
                        )}

                        {message.rows?.length > 0 && (
                            <div className="overflow-x-auto">
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
                                                        {String(value ?? "")}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {message.chart?.length > 0 && (
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={message.chart}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="label" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar
                                            dataKey="value"
                                            fill="#818cf8"
                                            radius={[5, 5, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                ))}

                {loading && (
                    <p className="text-indigo-300">
                        AI is analyzing your data...
                    </p>
                )}

                {error && (
                    <p className="rounded-lg bg-red-950 p-3 text-red-300">
                        {error}
                    </p>
                )}
            </div>

            <form onSubmit={handleAsk} className="flex gap-3">
                <input
                    value={question}
                    onChange={(event) =>
                        setQuestion(event.target.value)
                    }
                    maxLength={500}
                    placeholder="Ask about your dataset..."
                    className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-indigo-500"
                />

                <button
                    type="submit"
                    disabled={loading || !question.trim()}
                    className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white disabled:opacity-50"
                >
                    {loading ? "Thinking..." : "Ask AI"}
                </button>
            </form>
        </div>
    );
}
