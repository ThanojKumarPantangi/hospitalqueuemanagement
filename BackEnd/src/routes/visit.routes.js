import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import {
  createVisitController,
  getPatientVisitsController,
} from "../controllers/visit.controller.js";

const router=express.Router();

router.post("/",authMiddleware,roleMiddleware("DOCTOR"),createVisitController);

router.get(
  "/patient/:patientId",
  authMiddleware,
  roleMiddleware("DOCTOR", "ADMIN", "PATIENT"),
  getPatientVisitsController
);

export default router;