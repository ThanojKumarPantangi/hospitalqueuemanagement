import express from "express";
import {
  sendOTPController,
  verifyOTPController,
} from "../controllers/otp.controller.js";

import { otpRateLimit } from "../middlewares/otpRateLimit.middleware.js";

const router = express.Router();

router.post("/verify", verifyOTPController);
router.post("/send", otpRateLimit, sendOTPController);

export default router;