import express from "express";
import { login,refreshTokenController,logoutController,doctorSignupController,signupController } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/login", login);

router.post("/refresh", refreshTokenController);
router.post("/logout", logoutController);
router.post("/signup", signupController);
router.post("/doctor-signup", doctorSignupController);

export default router;
