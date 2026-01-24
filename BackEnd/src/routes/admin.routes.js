import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

import {
  createDepartment,
  updateDepartmentStatus,
  createDoctor,
  updateDepartmentSettings,
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
  verifyPatientQrController,
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

router.patch("/:departmentId",
    authMiddleware,
    roleMiddleware("ADMIN"),
    updateDepartmentSettings
);

router.patch(
  "/departments/:doctorId",
  authMiddleware,
  roleMiddleware("ADMIN"),
  updateDoctorDepartments
);


router.patch(
  "/doctor/on-leave",
  authMiddleware,
  roleMiddleware("ADMIN","DOCTOR"),
  markDoctorOnLeave
);

router.patch(
  "/doctor/return-from-leave",
  authMiddleware,
  roleMiddleware("ADMIN","DOCTOR"),
  markDoctorAvailable
);

router.patch(
  "/doctor/activate",
  authMiddleware,
  roleMiddleware("ADMIN"),
  activateDoctor
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

router.get("/doctor/not-verified", 
  authMiddleware, 
  roleMiddleware("ADMIN"),
  getNotVerifiedDoctors);

router.get("/dashboard/summary", 
  authMiddleware, 
  roleMiddleware("ADMIN"),
  getAdminDashboardSummary
);

router.patch("/departments/:departmentId/status", 
  authMiddleware, 
  roleMiddleware("ADMIN"),
  updateDepartmentStatus
);

router.get("/doctor/:doctorId",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getDoctorById
);

router.get("/doctors",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getDoctors
);

router.post("/verify-patient-qr", 
  authMiddleware, 
  roleMiddleware("ADMIN"),
  verifyPatientQrController);

export default router;