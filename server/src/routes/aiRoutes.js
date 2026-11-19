
import { Router } from "express";
import { askDatasetAI } from "../controllers/aiController.js";

const router = Router();

router.post("/ask", askDatasetAI);

export default router;
