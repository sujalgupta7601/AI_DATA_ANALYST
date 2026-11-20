
import {
    importDataset,
    getDatasetPreview,
    analyzeDataset, listDatasets, deleteDatasetById
} from "../services/duckdbService.js";
export async function getAllDatasets(req, res, next) {
    try {
        const datasets = await listDatasets();

        const safeDatasets = JSON.parse(
            JSON.stringify(datasets, (key, value) =>
                typeof value === "bigint"
                    ? Number.isSafeInteger(Number(value))
                        ? Number(value)
                        : value.toString()
                    : value
            )
        );

        res.json({
            success: true,
            data: safeDatasets,
        });
    } catch (error) {
        next(error);
    }
}
export async function uploadDataset(req, res, next) {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please select a CSV file.",
            });
        }

        const dataset = await importDataset(req.file);

        return res.status(201).json({
            success: true,
            message: "CSV uploaded successfully",
            data: dataset,
        });
    } catch (error) {
        next(error);
    }
}

export async function previewDataset(req, res, next) {
    try {
        const data = await getDatasetPreview(
            req.params.datasetId
        );

        return res.json({
            success: true,
            data,
        });
    } catch (error) {
        next(error);
    }
}

export async function getDatasetAnalysis(req, res, next) {
    try {
        const data = await analyzeDataset(
            req.params.datasetId
        );

        return res.json({
            success: true,
            data,
        });
    } catch (error) {
        next(error);
    }
}
export async function removeDataset(req, res, next) {
    try {
        const result = await deleteDatasetById(req.params.id);

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
}