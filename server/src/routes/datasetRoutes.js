
import { Router } from "express";
import { upload } from "../middleware/upload.js";

import {
    uploadDataset,
    previewDataset,
    getDatasetAnalysis,
} from "../controllers/datasetController.js";

const router = Router();

router.post("/upload", upload.single("file"), uploadDataset);

router.get("/:datasetId", previewDataset);

router.get("/:datasetId/analysis", getDatasetAnalysis);

export default router;
