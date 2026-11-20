
import { useEffect, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { fetchDatasetAnalysis } from "../services/api";
import {
    Database,
    Columns3,
    TrendingUp,
    Calculator,
} from "lucide-react";
export default function DatasetDashboard({ datasetId }) {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadAnalysis() {
            setLoading(true);
            setError("");

            try {
                const result = await fetchDatasetAnalysis(datasetId);

                if (!cancelled) {
                    setAnalysis(result.data);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadAnalysis();

        return () => {
            cancelled = true;
        };
    }, [datasetId]);


    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-800" />
                    <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded bg-slate-800" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[1, 2, 3, 4].map((item) => (
                        <div
                            key={item}
                            className="h-32 animate-pulse rounded-2xl border border-slate-700 bg-slate-800"
                        />
                    ))}
                </div>

                <div className="h-96 animate-pulse rounded-2xl border border-slate-700 bg-slate-800" />

                <p className="text-sm text-slate-400">
                    Analyzing your dataset...
                </p>
            </div>
        );
    }



    if (error) {
        return (
            <div
                role="alert"
                className="rounded-2xl border border-red-800 bg-red-950/40 p-6"
            >
                <h2 className="text-lg font-semibold text-red-300">
                    Unable to load dataset analytics
                </h2>

                <p className="mt-2 text-sm text-red-200">
                    {error}
                </p>

                <p className="mt-3 text-sm text-slate-400">
                    Check your backend connection and try refreshing
                    the page.
                </p>
            </div>
        );
    }


    if (!analysis) return null;

    const { dataset, stats, chart, measure, dimension } = analysis;

    const formatNumber = (value) =>
        value == null
            ? "N/A"
            : Number(value).toLocaleString("en-US", {
                maximumFractionDigits: 2,
            });

    const metrics = [
        {
            label: "Total Rows",
            value: stats.rowCount,
            icon: Database,
            color: "text-indigo-400",
        },
        {
            label: "Total Columns",
            value: stats.columnCount,
            icon: Columns3,
            color: "text-green-400",
        },
        {
            label: `Total ${measure || "Value"}`,
            value: stats.total,
            icon: TrendingUp,
            color: "text-amber-400",
        },
        {
            label: `Average ${measure || "Value"}`,
            value: stats.average,
            icon: Calculator,
            color: "text-sky-400",
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Dataset Analytics</h1>
                <p className="mt-2 text-slate-400">
                    Real SQL analysis of {dataset.name}
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => {
                    const Icon = metric.icon;

                    return (
                        <div
                            key={metric.label}
                            className="rounded-2xl border border-slate-700 bg-slate-900 p-6 transition-colors hover:border-indigo-500"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm text-slate-400">
                                    {metric.label}
                                </p>

                                <Icon className={`h-6 w-6 ${metric.color}`} />
                            </div>

                            <p className="mt-4 text-3xl font-bold text-white">
                                {formatNumber(metric.value)}
                            </p>
                        </div>
                    );
                })}
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
                <h2 className="mb-2 text-xl font-semibold capitalize text-white">
                    {dimension && measure
                        ? `${measure} by ${dimension}`
                        : "Dataset Overview"}
                </h2>

                <p className="mb-6 text-sm text-slate-400">
                    {dimension && measure
                        ? `Compare ${measure} across different ${dimension} values.`
                        : "Visual representation of your dataset."}
                </p>

                {chart.length > 0 ? (
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">

                            <BarChart
                                data={chart}
                                margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#334155"
                                    vertical={false}
                                />

                                <XAxis
                                    dataKey="label"
                                    stroke="#94a3b8"
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                    interval={0}
                                    angle={chart.length > 5 ? -25 : 0}
                                    textAnchor={chart.length > 5 ? "end" : "middle"}
                                    height={chart.length > 5 ? 65 : 30}
                                />

                                <YAxis
                                    stroke="#94a3b8"
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) =>
                                        Number(value).toLocaleString("en-US", {
                                            notation: "compact",
                                            maximumFractionDigits: 1,
                                        })
                                    }
                                />

                                <Tooltip
                                    formatter={(value) => [
                                        formatNumber(value),
                                        measure || "Value",
                                    ]}
                                    contentStyle={{
                                        backgroundColor: "#0f172a",
                                        border: "1px solid #334155",
                                        borderRadius: "12px",
                                        color: "#f8fafc",
                                    }}
                                    labelStyle={{ color: "#cbd5e1" }}
                                />

                                <Bar
                                    dataKey="value"
                                    name={measure || "Value"}
                                    fill="#818cf8"
                                    radius={[6, 6, 0, 0]}
                                    maxBarSize={80}
                                />
                            </BarChart>

                        </ResponsiveContainer>
                    </div>
                ) : (
                    <p className="text-slate-400">
                        No suitable numeric and category columns found.
                    </p>
                )}
            </div>
        </div>
    );
}
