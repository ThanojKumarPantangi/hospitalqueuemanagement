import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import { changePasswordController,changePhoneController  } from "../controllers/user.controller.js";

const router = express.Router();

router.patch("/change-password", authMiddleware,roleMiddleware("ADMIN","DOCTOR","PATIENT"), changePasswordController);

router.patch("/change-phone", authMiddleware,roleMiddleware("ADMIN","DOCTOR","PATIENT"), changePhoneController);

export default router;
