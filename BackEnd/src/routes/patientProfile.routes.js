import express from "express";
import { getMyPatientProfileController,getPatientProfileForDoctorController,updateMyPatientProfileController } from "../controllers/patientProfile.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/me", 
    authMiddleware,
    roleMiddleware("PATIENT"),
    getMyPatientProfileController
);

router.get(
  "/:patientId",
  authMiddleware,
  roleMiddleware("ADMIN","DOCTOR"),
  getPatientProfileForDoctorController
);

router.post(
  "/me",
  authMiddleware,
  roleMiddleware("PATIENT"),
  updateMyPatientProfileController
);


export default router;