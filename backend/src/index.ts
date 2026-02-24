import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config/env";

import authRoutes from "./routes/auth.routes";
import courseRoutes from "./routes/course.routes";
import moduleRoutes from "./routes/module.routes";
import lessonRoutes from "./routes/lesson.routes";
import quizRoutes from "./routes/quiz.routes";
import schedulingRoutes from "./routes/scheduling.routes";
import adminRoutes from "./routes/admin.routes";

const app = express();

// ── Global Middleware ─────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
if (config.nodeEnv !== "test") {
  app.use(morgan("combined"));
}

// ── Health Check ──────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString(), version: "1.0.0" });
});

// ── API Routes ────────────────────────────────
const API = "/api";
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/courses`, courseRoutes);
app.use(`${API}/modules`, moduleRoutes);
app.use(`${API}/lessons`, lessonRoutes);
app.use(`${API}/quiz`, quizRoutes);
app.use(`${API}/scheduling`, schedulingRoutes);
app.use(`${API}/admin`, adminRoutes);

// ── 404 Handler ───────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ── Error Handler ─────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal server error" });
});

// ── Start ──────────────────────────────────────
if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`🚀 AIRMAN Core backend running on port ${config.port} [${config.nodeEnv}]`);
  });
}

export { app };
