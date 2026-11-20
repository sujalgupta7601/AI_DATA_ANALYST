
import { useState, useEffect } from "react";
import {
    uploadCSV,
    fetchDatasetPreview,
    getAllDatasets,
    deleteDataset,
} from "../services/api";
export default function Datasets({
    datasetId,
    setDatasetId,
}) {
    const [file, setFile] = useState(null);
    const [dataset, setDataset] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [savedDatasets, setSavedDatasets] = useState([]);
    const [deletingId, setDeletingId] = useState(null);
    async function loadDatasets() {
        const response = await getAllDatasets();
        setSavedDatasets(response.data || []);
    }
    useEffect(() => {
        loadDatasets().catch((err) => {
            setError(err.message);
        });
    }, []);
    useEffect(() => {
        let cancelled = false;

        async function loadSavedDataset() {
            if (!datasetId) {
                setDataset(null);
                return;
            }

            try {
                const response = await fetchDatasetPreview(datasetId);

                if (!cancelled) {
                    setDataset(response.data);
                    setError("");
                }
            } catch (err) {
                if (!cancelled) {
                    setDataset(null);
                    setError(
                        "Could not load saved dataset: " + err.message
                    );
                }
            }
        }

        loadSavedDataset();

        return () => {
            cancelled = true;
        };
    }, [datasetId]);

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

            await loadDatasets();

            setFile(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }
    function handleSelect(id) {
        setError("");
        setDataset(null);
        setDatasetId(id);
    }
    async function handleDelete(id) {
        const confirmed = window.confirm(
            "Are you sure you want to permanently delete this dataset?"
        );

        if (!confirmed) return;

        setDeletingId(id);
        setError("");

        try {
            await deleteDataset(id);

            const response = await getAllDatasets();
            const remaining = response.data || [];

            setSavedDatasets(remaining);

            if (datasetId === id) {
                setDataset(null);
                setDatasetId(remaining[0]?.id || null);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setDeletingId(null);
        }
    }
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">
                    Datasets
                </h1>
                <p className="text-slate-400 mt-2">
                    Upload CSV or Excel (.xlsx) files to analyze them with DuckDB.
                </p>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
                <input
                    type="file"
                    accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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
                    {loading ? "Uploading..." : "Upload Dataset"}
                </button>

                {error && (
                    <p className="mt-4 text-red-400">
                        {error}
                    </p>
                )}
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
                <h2 className="mb-4 text-xl font-semibold">
                    Saved Datasets
                </h2>

                {savedDatasets.length === 0 ? (
                    <p className="text-slate-400">
                        No saved datasets yet.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {savedDatasets.map((item) => (
                            <div
                                key={item.id}
                                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-800 p-4"
                            >
                                <div>
                                    <p className="font-semibold text-white">
                                        {item.name}
                                    </p>

                                    <p className="text-sm text-slate-400">
                                        {item.rowCount} rows
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleSelect(item.id)}
                                        disabled={datasetId === item.id}
                                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-50"
                                    >
                                        {datasetId === item.id
                                            ? "Selected"
                                            : "Select"}
                                    </button>

                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        disabled={deletingId !== null}
                                        className="rounded-lg bg-red-600/20 px-4 py-2 text-sm text-red-300 disabled:opacity-50"
                                    >
                                        {deletingId === item.id
                                            ? "Deleting..."
                                            : "Delete"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
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
