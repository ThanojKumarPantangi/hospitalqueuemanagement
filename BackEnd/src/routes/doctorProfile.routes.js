import express from "express";
import {
  getMyDoctorProfile,
  getDoctorProfileById,
  updateMyDoctorProfile,
  adminUpdateDoctorProfile,
  getPublicDoctors,
} from "../controllers/doctorProfile.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

/**
 * 👨‍⚕️ Doctor → get own profile
 */
router.get(
  "/me",
  authMiddleware,
  roleMiddleware("DOCTOR"),
  getMyDoctorProfile
);

/**
 * 👨‍⚕️ PATIENT → get public doctors list
 */
router.get(
  "/doctors",
  authMiddleware,
  roleMiddleware("PATIENT"),
  getPublicDoctors
);

/**
 * 👨‍💼 Admin → get any doctor profile by userId
 */
router.get(
  "/:userId",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getDoctorProfileById
);

/**
 * 👨‍⚕️ Doctor → save own profile (create/update)
 */
router.post(
  "/me",
  authMiddleware,
  roleMiddleware("DOCTOR"),
  updateMyDoctorProfile
);

/**
 * 👨‍💼 Admin → save any doctor profile
 */
router.post(
  "/:userId",
  authMiddleware,
  roleMiddleware("ADMIN"),
  adminUpdateDoctorProfile
);

export default router;