
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
        return <p className="text-slate-300">Analyzing dataset...</p>;
    }

    if (error) {
        return <p className="text-red-400">{error}</p>;
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
        { label: "Total Rows", value: stats.rowCount },
        { label: "Total Columns", value: stats.columnCount },
        { label: `Total ${measure || "Value"}`, value: stats.total },
        { label: `Average ${measure || "Value"}`, value: stats.average },
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
                {metrics.map((metric) => (
                    <div
                        key={metric.label}
                        className="rounded-2xl border border-slate-700 bg-slate-900 p-6"
                    >
                        <p className="text-sm text-slate-400">
                            {metric.label}
                        </p>
                        <p className="mt-3 text-3xl font-bold text-white">
                            {formatNumber(metric.value)}
                        </p>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
                <h2 className="mb-6 text-xl font-semibold">
                    {dimension && measure
                        ? `${measure} by ${dimension}`
                        : "Dataset Chart"}
                </h2>

                {chart.length > 0 ? (
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chart}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="label" />
                                <YAxis />
                                <Tooltip />
                                <Bar
                                    dataKey="value"
                                    fill="#818cf8"
                                    radius={[6, 6, 0, 0]}
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
