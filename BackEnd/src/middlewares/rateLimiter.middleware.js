import rateLimit from "express-rate-limit";

/* ---------- Global limiter ---------- */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests. Please try again later."
  }
});

/* ---------- Auth & OTP limiter ---------- */
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: {
    message: "Too many attempts. Please try again later."
  }
});

/* ---------- Token creation limiter ---------- */
export const tokenLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: {
    message: "Too many token requests. Please wait."
  }
});
