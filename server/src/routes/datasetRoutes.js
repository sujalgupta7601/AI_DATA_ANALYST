
import { Router } from "express";
import { upload } from "../middleware/upload.js";

import {
    uploadDataset,
    previewDataset,
    getDatasetAnalysis, getAllDatasets, removeDataset
} from "../controllers/datasetController.js";

const router = Router();
router.get("/", getAllDatasets);
router.post("/upload", upload.single("file"), uploadDataset);

router.get("/:datasetId", previewDataset);

router.get("/:datasetId/analysis", getDatasetAnalysis);
router.delete("/:id", removeDataset);
export default router;
