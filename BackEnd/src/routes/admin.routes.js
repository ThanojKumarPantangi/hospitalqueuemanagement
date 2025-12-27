import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

import {
  createDepartment,
  closeDepartment,
  createDoctor,
  verifyDoctor,
  getNotVerifiedDoctors,
  getDoctorById,
  getDoctors,
  markDoctorOnLeave,
  markDoctorAvailable,
  markDoctorInactive,
  activateDoctor,
  createAdminController,
  getDepartmentsStatus,
  getAdminDashboardSummary,
  updateDoctorDepartments,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.post(
  "/department",
  authMiddleware,
  roleMiddleware("ADMIN"),
  createDepartment
);

router.patch("/verify-doctor",
  authMiddleware,
  roleMiddleware("ADMIN"),
  verifyDoctor
);

router.post(
  "/doctor",
  authMiddleware,
  roleMiddleware("ADMIN"),
  createDoctor
);

router.patch(
  "/doctor/:doctorId/departments",
  authMiddleware,
  roleMiddleware("ADMIN"),
  updateDoctorDepartments
);


router.patch(
  "/doctor/on-leave",
  authMiddleware,
  roleMiddleware("ADMIN"),
  markDoctorOnLeave
);


router.patch(
  "/doctor/inactive",
  authMiddleware,
  roleMiddleware("ADMIN"),
  markDoctorInactive
);

router.post(
  "/create-admin",
  authMiddleware,
  roleMiddleware("ADMIN"),
  createAdminController
);

router.get(
  "/departments/status",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getDepartmentsStatus
);

router.get("/doctors/not-verified", 
  authMiddleware, 
  roleMiddleware("ADMIN"),
  getNotVerifiedDoctors);

router.patch(
  "/doctors/return-from-leave",
  authMiddleware,
  roleMiddleware("ADMIN"),
  markDoctorAvailable
);

router.patch(
  "/doctors/activate",
  authMiddleware,
  roleMiddleware("ADMIN"),
  activateDoctor
);


router.get("/dashboard/summary", 
  authMiddleware, 
  roleMiddleware("ADMIN"),
  getAdminDashboardSummary
);

router.patch("/departments/:departmentId/close", 
  authMiddleware, 
  roleMiddleware("ADMIN"),
  closeDepartment
);

router.get("/doctors/:doctorId",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getDoctorById
);

router.get("/doctors",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getDoctors
);

export default router;