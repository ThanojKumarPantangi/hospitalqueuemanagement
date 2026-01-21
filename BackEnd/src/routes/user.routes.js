import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import { changePasswordController,changePhoneController,
        forgotPasswordController,resetPasswordController
    } from "../controllers/user.controller.js";
import {authLimiter,tokenLimiter} from "../middlewares/rateLimiter.middleware.js"
const router = express.Router();

router.patch("/change-password", 
    authMiddleware,
    roleMiddleware("ADMIN","DOCTOR","PATIENT"), 
    changePasswordController);

router.patch("/change-phone", 
    authMiddleware,
    roleMiddleware("ADMIN","DOCTOR","PATIENT"), 
    changePhoneController);

router.post("/forgot-password",
    tokenLimiter, 
    forgotPasswordController
);
router.post("/reset-password", 
    authLimiter,
    resetPasswordController
);

export default router;