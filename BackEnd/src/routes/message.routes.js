import express from "express";
import {
  sendMessageController,
  getMessagesController,
  markMessagesReadController,
  sendDepartmentAnnouncementController
} from "../controllers/message.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

/* ============================
   ADMIN → SEND MESSAGE
============================ */
router.post(
  "/send",
  authMiddleware,
  roleMiddleware("ADMIN"),
  sendMessageController
);

/* ======================================
   ADMIN → DEPARTMENT ANNOUNCEMENT
====================================== */
router.post(
  "/department-announcement",
  authMiddleware,
  roleMiddleware("ADMIN"),
  sendDepartmentAnnouncementController
);


/* ============================
   USER → FETCH MESSAGE HISTORY
============================ */
router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN","DOCTOR","PATIENT"),
  getMessagesController
);

/* ============================
   USER → MARK AS READ
============================ */
router.post(
  "/read",
  authMiddleware,
  roleMiddleware("ADMIN","DOCTOR","PATIENT"),
  markMessagesReadController
);

export default router;
