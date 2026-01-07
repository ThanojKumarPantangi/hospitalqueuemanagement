import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import {
  getMyActiveSessions,
  logoutSessionById,
  logoutAllMySessions
} from "../controllers/session.controller.js";

const router = express.Router();

router.get("/my-sessions", 
    authMiddleware,
    roleMiddleware("PATIENT"), 
    getMyActiveSessions
);

router.post("/logout/:sessionId",
    authMiddleware,
    roleMiddleware("PATIENT"), 
    logoutSessionById
);

router.post("/logout-all", 
    authMiddleware,
    roleMiddleware("PATIENT"),
    logoutAllMySessions
);

export default router;
