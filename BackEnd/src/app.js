import dotenv from "dotenv";
dotenv.config({ path: "./src/.env" });
import express from "express";
import sanitize from "mongo-sanitize";
import cookieParser from "cookie-parser";
import cors from "cors";
import redis  from "./config/redisClient.js";


import authRoutes from "./routes/auth.routes.js";
import queueRoutes from "./routes/queue.routes.js";
import visitRoutes from "./routes/visit.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import otpRoutes from "./routes/otp.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import tvRoutes from "./routes/tv.routes.js";
import departmentRoutes from "./routes/department.route.js";
import doctorRoutes from "./routes/doctorProfile.routes.js";
import messageRoutes from "./routes/message.routes.js";
import sessionRoutes from "./routes/session.routes.js";
import userRoutes from "./routes/user.routes.js";
import patientProfileRoutes from "./routes/patientProfile.routes.js";
import medicineRoutes from "./routes/medicine.routes.js";
import templateRoutes from "./routes/template.routes.js";
import consultationRoutes from "./routes/consultation.routes.js";
import turnRoutes from "./routes/turn.routes.js";

import {globalLimiter} from "./middlewares/rateLimiter.middleware.js";

process.on("uncaughtException", (err) => {
  console.error("🔥 UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("🔥 UNHANDLED REJECTION:", err);
});

const app = express();

app.use((req, res, next) => {
  console.log("➡️", req.method, req.path, req.headers["user-agent"]);
  next();
});
app.set("trust proxy", 2);
/* ------------------ Core middleware ------------------ */
app.use(express.json());
app.use((req, res, next) => {
  console.log("✅ Passed express.json");
  next();
});
app.use(cookieParser());
app.use((req, res, next) => {
  console.log("✅ Passed cookieParser");
  next();
});

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use((req, res, next) => {
  console.log("✅ Passed CORS");
  next();
});

app.use(globalLimiter);
app.use((req, res, next) => {
  console.log("✅ Passed rate limiter");
  next();
});

/* ------------------ Security: Mongo sanitize ------------------ */
app.use((req, res, next) => {
  if (req.body) {
    Object.assign(req.body, sanitize(req.body));
  }
  if (req.query) {
    Object.assign(req.query, sanitize(req.query));
  }
  if (req.params) {
    Object.assign(req.params, sanitize(req.params));
  }
  next();
});

console.log("✅ Sanitize done");

/* ------------------ Routes ------------------ */
app.use("/api/auth",authRoutes);
app.use("/api/queue",queueRoutes);
app.use("/api/visits", visitRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/tv", tvRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/doctorProfile", doctorRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/users",userRoutes);
app.use("/api/patient-profile", patientProfileRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api/turn-credentials", turnRoutes);


/* ------------------ Health check ------------------ */
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

// (async () => {
//   try {
//     await redis.set("healthcheck", "ok");
//     console.log("Redis Connected");
//   } catch (err) {
//     console.error("Redis Connection Failed", err);
//   }
// })();


export default app;