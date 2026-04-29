import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import geocodeRoutes from "./routes/geocode.js";
import routeRoutes from "./routes/route.js";
import healthRoutes from "./routes/health.js";

const app = express();

// Use the PORT from .env strictly
const PORT = process.env.PORT || 3001;

// 1. Security Middleware
app.use(helmet());

app.use(
  cors({
    // Hardcoded to 3000 for frontend as requested
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json({ limit: "10kb" }));

// 2. Optimized Rate Limiting Strategy
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Search limit reached. Please wait a moment." },
});

const optimizeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Optimization limit reached. Please wait a minute." },
});

// 3. Request Logging Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// 4. Routes
app.use("/api/health", healthRoutes);
app.use("/api/geocode", searchLimiter, geocodeRoutes);
app.use("/api/route", optimizeLimiter, routeRoutes);

// 5. 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// 6. Global Error Handler
app.use((err, req, res, next) => {
  console.error("[Global Error]", err.message);

  const isDev = process.env.NODE_ENV === "development";

  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    ...(isDev && { stack: err.stack }),
  });
});

// 7. Start Server
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  console.log(`CORS allowed for: http://localhost:3000`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`ORS API: ${process.env.ORS_API_KEY ? "Configured" : "Missing"}`);
  console.log(
    `OpenCage: ${process.env.OPENCAGE_API_KEY ? "Configured" : "Missing"}`,
  );
});

export default app;
