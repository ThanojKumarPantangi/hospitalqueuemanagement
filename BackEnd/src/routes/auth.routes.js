import express from "express";
import {
  login,
  refreshTokenController,
  logoutController,
  doctorSignupController,
  signupController,
  getMe,
} from "../controllers/auth.controller.js";
import {verifyMfaController,setupMfaController,confirmMfaController} from "../controllers/mfa.controller.js"
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/refresh", refreshTokenController);
router.post("/logout", logoutController);
router.get("/me", authMiddleware, getMe);
router.post("/signup", signupController);
router.post("/doctor-signup", doctorSignupController);
router.post("/verify-mfa", verifyMfaController);
router.post("/setup-mfa", setupMfaController);
router.post("/confirm-mfa", confirmMfaController);
export default router;
