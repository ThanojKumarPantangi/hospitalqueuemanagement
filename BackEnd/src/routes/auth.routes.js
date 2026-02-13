import express from "express";
import {
  login,
  refreshTokenController,
  logoutController,
  doctorSignupController,
  signupController,
  getMe,
} from "../controllers/auth.controller.js";
import {verifyMfaController,setupMfaController,confirmMfaController,recoverMfaController,adminResetMfaController,getRecoveryPreviewController} from "../controllers/mfa.controller.js"
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

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
router.post("/recover-mfa", recoverMfaController);
router.post(
  "/admin/reset-mfa/:userId",
  authMiddleware,
  roleMiddleware("ADMIN"),
  adminResetMfaController
);
router.post("/recovery-preview", getRecoveryPreviewController);

export default router;