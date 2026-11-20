
import express from "express";
import cors from "cors";
import helmet from "helmet";

import dashboardRoutes from "./routes/dashboardRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import datasetRoutes from "./routes/datasetRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
const app = express();

app.use(helmet());


app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
        ],
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);


// Allow JSON requests up to 100 KB
app.use(express.json({ limit: "100kb" }));

// Our first API
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "DataPilot AI backend is running!",
    });
});

// API routes
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/datasets", datasetRoutes);
app.use("/api/ai", aiRoutes);
// Handle unknown API routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});

// Central error handler
app.use(errorHandler);

export default app;
