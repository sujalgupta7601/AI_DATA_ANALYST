
import { useState } from "react";
import {
    uploadCSV,
    fetchDatasetPreview,
} from "../services/api";

export default function Datasets({
    datasetId,
    setDatasetId,
}) {
    const [file, setFile] = useState(null);
    const [dataset, setDataset] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleUpload() {
        if (!file) return;

        setLoading(true);
        setError("");

        try {
            const uploaded = await uploadCSV(file);
            const id = uploaded.data.id;

            const preview = await fetchDatasetPreview(id);

            setDatasetId(id);
            setDataset(preview.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">
                    Datasets
                </h1>
                <p className="text-slate-400 mt-2">
                    Upload your CSV to analyze it with DuckDB.
                </p>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
                <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) =>
                        setFile(e.target.files?.[0] || null)
                    }
                    className="block w-full text-sm text-slate-300"
                />

                <button
                    onClick={handleUpload}
                    disabled={!file || loading}
                    className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
                >
                    {loading ? "Uploading..." : "Upload CSV"}
                </button>

                {error && (
                    <p className="mt-4 text-red-400">
                        {error}
                    </p>
                )}
            </div>

            {dataset && (
                <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
                    <h2 className="text-xl font-semibold">
                        {dataset.name}
                    </h2>

                    <p className="mt-2 text-slate-400">
                        {dataset.rowCount} rows ·{" "}
                        {dataset.columns.length} columns
                    </p>

                    <div className="mt-5 overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-700">
                                    {dataset.columns.map((column) => (
                                        <th
                                            key={column.sqlName}
                                            className="p-3"
                                        >
                                            {column.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                <caption className="text-white">
                                    Preview rows: {dataset.preview?.length ?? 0}
                                </caption>
                                {dataset.preview.map((row, index) => (
                                    <tr
                                        key={index}
                                        className="border-b border-slate-800"
                                    >
                                        {dataset.columns.map((column) => (
                                            <td
                                                key={column.sqlName}
                                                className="p-3 text-slate-300"
                                            >
                                                {String(
                                                    row[column.name] ?? ""
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
