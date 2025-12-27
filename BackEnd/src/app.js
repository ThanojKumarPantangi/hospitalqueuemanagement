import express from "express";
import sanitize from "mongo-sanitize";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import tokenRoutes from "./routes/token.routes.js";
import visitRoutes from "./routes/visit.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import otpRoutes from "./routes/otp.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import tvRoutes from "./routes/tv.routes.js";
import departmentRoutes from "./routes/department.route.js";


import {
  globalLimiter,
  authLimiter,
  tokenLimiter,
} from "./middlewares/rateLimiter.middleware.js";

const app = express();
/* ------------------ Core middleware ------------------ */
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:5173",
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
app.use("/api/auth", authLimiter,authRoutes);

//tokenLimiter,
app.use("/api/tokens",tokenRoutes);
app.use("/api/visits", visitRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/tv", tvRoutes);
app.use("/api/departments", departmentRoutes);

/* ------------------ Health check ------------------ */
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

export default app;