
import {
    importDataset,
    getDatasetPreview,
    analyzeDataset,
} from "../services/duckdbService.js";

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
