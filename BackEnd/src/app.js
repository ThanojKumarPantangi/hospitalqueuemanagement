import express from "express";
import sanitize from "mongo-sanitize";
import cookieParser from "cookie-parser";
import cors from "cors";

import dotenv from "dotenv";
dotenv.config({ path: "./src/.env" });


import authRoutes from "./routes/auth.routes.js";
import tokenRoutes from "./routes/token.routes.js";
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





import {
  globalLimiter,
  authLimiter,
  tokenLimiter,
} from "./middlewares/rateLimiter.middleware.js";

const app = express();
app.set("trust proxy", false);
/* ------------------ Core middleware ------------------ */
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
// app.use(globalLimiter);

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





/* ------------------ Routes ------------------ */
//, authLimiter
app.use("/api/auth",authRoutes);

//tokenLimiter,
app.use("/api/tokens",tokenRoutes);
app.use("/api/visits", visitRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/tv", tvRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/doctorProfile", doctorRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/users",tokenLimiter,userRoutes);
app.use("/api/patient-profile", patientProfileRoutes)

/* ------------------ Health check ------------------ */
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

export default app;