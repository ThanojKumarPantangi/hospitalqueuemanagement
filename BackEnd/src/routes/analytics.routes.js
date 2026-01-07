import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import {
  getDailyPatientCount,
  getDepartmentLoad,
  getDoctorWorkload,
  getTodayRevenue,
  getRevenueByDepartment,
  getPaymentStats,
} from "../controllers/analytics.controller.js";

const router = express.Router();

router.get(
  "/daily-patients",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getDailyPatientCount
);

router.get(
  "/department-load",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getDepartmentLoad
);

router.get(
  "/doctor-workload",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getDoctorWorkload
);

router.get("/payments/revenue/today", 
  authMiddleware,
  roleMiddleware("ADMIN"),
  getTodayRevenue
);

router.get("/payments/revenue/department",
  authMiddleware,
  roleMiddleware("ADMIN"), 
  getRevenueByDepartment
);

router.get("/payments/stats",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getPaymentStats
);

export default router;
