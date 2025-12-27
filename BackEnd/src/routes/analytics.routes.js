import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import {
  getDailyPatientCount,
  getDepartmentLoad,
  getDoctorWorkload,
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

export default router;
