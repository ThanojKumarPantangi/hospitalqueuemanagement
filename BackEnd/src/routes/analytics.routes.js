import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

import {
  getDailyPatientCount,
  getDepartmentLoad,
  getDoctorWorkload,
  getTodayAvgWaitingTime,
  getConsultationTime,
  getDepartmentPeakHours,
  getThroughput,
  getCancelRate,
  getDoctorUtilization,
  getLiveQueueSnapshot,
  getPatientTrend,
} from "../controllers/analytics.controller.js";

const router = express.Router();

/**
 * Only ADMIN can access analytics (recommended)
 * If you want DOCTOR also, add it.
 */
router.use(authMiddleware, roleMiddleware("ADMIN"));

router.get("/daily-patient-count", getDailyPatientCount);
router.get("/department-load", getDepartmentLoad);
router.get("/doctor-workload", getDoctorWorkload);

router.get("/waiting-time/today", getTodayAvgWaitingTime);
router.get("/consultation-time", getConsultationTime);

router.get("/department-peak-hours", getDepartmentPeakHours);
router.get("/throughput", getThroughput);
router.get("/cancel-rate", getCancelRate);

router.get("/doctor-utilization", getDoctorUtilization);
router.get("/live-queue", getLiveQueueSnapshot);
router.get("/patient-trend", getPatientTrend);

export default router;