import OTP from "../models/otp.model.js";

const OTP_WINDOW_MINUTES = 10;
const MAX_OTP_REQUESTS = 3;

export const otpRateLimit = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const windowStart = new Date(
      Date.now() - OTP_WINDOW_MINUTES * 60 * 1000
    );

    const recentOtpCount = await OTP.countDocuments({
      email,
      createdAt: { $gte: windowStart },
    });

    if (recentOtpCount >= MAX_OTP_REQUESTS) {
      return res.status(429).json({
        message: "Too many OTP requests. Please try again later.",
      });
    }

    next();
  } catch (error) {
    console.error("OTP rate limiter error:", error);
    return res.status(500).json({
      message: "OTP rate limit error",
    });
  }
};
