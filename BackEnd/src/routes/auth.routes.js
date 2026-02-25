import express from "express";
import {
  login,
  refreshTokenController,
  logoutController,
  doctorSignupController,
  signupController,
  getMe,
} from "../controllers/auth.controller.js";
import {verifyMfaController,
  setupMfaController,
  confirmMfaController,
  recoverMfaController,
  adminResetMfaController,
  getRecoveryPreviewController,
  toggleTwoStepController
} from "../controllers/mfa.controller.js"
import {authLimiter} from "../middlewares/rateLimiter.middleware.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();
// ,authLimiter
router.post("/login", login);
router.post("/refresh", refreshTokenController);
router.post("/logout", logoutController);
router.get("/me", authMiddleware, getMe);
router.post("/signup",authLimiter, signupController);
router.post("/doctor-signup",authLimiter, doctorSignupController);
router.post("/verify-mfa",authLimiter, verifyMfaController);
router.post("/setup-mfa",authLimiter, setupMfaController);
router.post("/confirm-mfa",authLimiter, confirmMfaController);
router.post("/recover-mfa",authLimiter, recoverMfaController);
router.post(
  "/admin/reset-mfa/:userId",
  authMiddleware,
  roleMiddleware("ADMIN"),
  adminResetMfaController
);
router.post("/recovery-preview", getRecoveryPreviewController);

router.post("/toggle-mfa",
  authLimiter,
  authMiddleware,
  roleMiddleware("PATIENT"), 
  toggleTwoStepController
);

export default router;