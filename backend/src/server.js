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
const PORT = process.env.PORT || 5000;

// 1. Security Middleware
app.use(helmet());

app.use(
  cors({
    origin: [
      "http://localhost:3000", 
      "http://localhost:3001",
      // You can keep the Vercel regex or remove it if strictly local
      /\.vercel\.app$/ 
    ],
    credentials: true,
  }),
);

app.use(express.json({ limit: "10kb" }));

// 2. Rate Limiting
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: { error: "Too many requests, please try again later." },
});

const optimizeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { error: "Optimization limit reached." },
});

// 3. Logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// 4. Routes 
// REVERTED: Added back the "/api" prefix for standard local/VPS structure
app.use("/api/health", healthRoutes);
app.use("/api/geocode", searchLimiter, geocodeRoutes);
app.use("/api/route", optimizeLimiter, routeRoutes);

// 5. 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "API Route not found" });
});

// 6. Global Error Handler
app.use((err, req, res, next) => {
  console.error("[Global Error]", err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error"
  });
});

// 7. Start Server
// REVERTED: Removed the production check so it always listens on the PORT
app.listen(PORT, () => {
  console.log(`Backend server started successfully`);
  console.log(`Listening on port: ${PORT}`);
  console.log(`Base Path: http://localhost:${PORT}/api`);
  console.log(`ORS API: ${process.env.ORS_API_KEY ? "Connected" : "Not Found"}`);
  console.log(`OpenCage: ${process.env.OPENCAGE_API_KEY ? "Connected" : "Not Found"}`);
});

export default app;