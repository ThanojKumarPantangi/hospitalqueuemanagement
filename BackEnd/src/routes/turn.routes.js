import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import express from "express";
import {tokenLimiter} from "../middlewares/rateLimiter.middleware.js";

const router = express.Router();

router.get("/", (req, res) => {
  tokenLimiter,
  authMiddleware,
  roleMiddleware("DOCTOR","PATIENT"),
  res.json({
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302"
      },
      {
        urls: process.env.TURN_URL,
        username: process.env.TURN_USERNAME,
        credential: process.env.TURN_PASSWORD
      }
    ]
  });

});

export default router;