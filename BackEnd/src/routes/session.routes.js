import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import {
  getMyActiveSessions,
  logoutSessionById,
  logoutAllMySessions,
  getSecurityEvents,
  markSecurityEventAsRead,
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

router.get(
    "/security-events", 
    authMiddleware,
    roleMiddleware("PATIENT","ADMIN","DOCTOR"), 
    getSecurityEvents
);

router.patch(
  "/security-events/:id/read",
  authMiddleware,
  roleMiddleware("PATIENT","ADMIN","DOCTOR"),
  markSecurityEventAsRead
);

router.patch(
  "/security-events/mark-all-read",
  authMiddleware,
  roleMiddleware("PATIENT","ADMIN","DOCTOR"),
  markSecurityEventAsRead
);


export default router;
