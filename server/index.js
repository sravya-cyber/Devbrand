import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { connectRedis } from "./config/redis.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { createPostQueue } from "./queues/postQueue.js";
import { startPostWorker } from "./queues/workers/postWorker.js";
import { startMilestoneChecker, runMilestoneCheck } from "./services/milestoneService.js";
import authRoutes from "./routes/auth.js";
import postRoutes from "./routes/posts.js";
import aiRoutes from "./routes/ai.js";
import analyticsRoutes from "./routes/analytics.js";
import accountRoutes from "./routes/accounts.js";
import milestoneRoutes from "./routes/milestones.js";
import logger from "./utils/logger.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "DevBrand API is running" });
});

// Routes
app.use("/api/auth",       authRoutes);
app.use("/api/posts",      postRoutes);
app.use("/api/ai",         aiRoutes);
app.use("/api/analytics",  analyticsRoutes);
app.use("/api/accounts",   accountRoutes);
app.use("/api/milestones", milestoneRoutes);

// Global error handler
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();

    createPostQueue();
    startPostWorker();
    startMilestoneChecker(); // starts the every-30-min cron

    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
    });

    // Run milestone check immediately on startup (after 3s delay for DB to settle)
    setTimeout(async () => {
      logger.info("🔍 Running initial milestone check on startup...");
      try {
        await runMilestoneCheck();
        logger.info("✅ Initial milestone check complete");
      } catch (err) {
        logger.error("Initial milestone check failed:", err.message);
      }
    }, 3000);

  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;