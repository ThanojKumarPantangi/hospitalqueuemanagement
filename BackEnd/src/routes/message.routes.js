import express from "express";
import {
  sendMessageController,
  getMessagesController,
  markMessagesReadController,
  sendDepartmentAnnouncementController,
  sendGlobalWaitingPatientsMessageController,
  sendGlobalActiveDoctorsMessageController,
  sendMessageToAdminController,
  replyToThreadController,
  getAdminThreadsController,
  getThreadMessagesController,
  getUserThreadMessagesController,
  getUserThreadsController,
  closeTicketController,
  previewRecipientsController
} from "../controllers/message.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

/* ============================
   ADMIN → SEND DIRECT MESSAGE
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

/* ==========================================
   ADMIN → GLOBAL WAITING PATIENTS ANNOUNCEMENT
========================================== */
router.post(
  "/global/waiting-patients",
  authMiddleware,
  roleMiddleware("ADMIN"),
  sendGlobalWaitingPatientsMessageController
);

/* ==========================================
   ADMIN → GLOBAL ACTIVE DOCTORS ANNOUNCEMENT
========================================== */
router.post(
  "/global/active-doctors",
  authMiddleware,
  roleMiddleware("ADMIN"),
  sendGlobalActiveDoctorsMessageController
);

/* ==========================================
   PATIENT,DOCTOR → SEND MESSAGE TO ADMIN
========================================== */

router.post(
  "/to-admin",
  authMiddleware,
  roleMiddleware("DOCTOR", "PATIENT"),
  sendMessageToAdminController
);

/* ============================
   USER (PATIENT / DOCTOR)
============================ */
router.get(
  "/my/threads",
  authMiddleware,
  roleMiddleware("PATIENT", "DOCTOR"),
  getUserThreadsController
);

router.get(
  "/my/thread/:threadId",
  authMiddleware,
  roleMiddleware("PATIENT", "DOCTOR"),
  getUserThreadMessagesController
);

router.post(
  "/tickets/:threadId/close",
  authMiddleware,
  roleMiddleware("ADMIN"),
  closeTicketController
);

router.post(
  "/reply",
  authMiddleware,
  roleMiddleware("ADMIN","PATIENT", "DOCTOR"),
  replyToThreadController
);

router.get(
  "/admin/threads",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getAdminThreadsController
);

router.get(
  "/thread/:threadId",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getThreadMessagesController
);

/* ============================
   ADMIN → PREVIEW RECIPIENTS
============================ */
router.get(
  "/preview",
  authMiddleware,
  roleMiddleware("ADMIN"),
  previewRecipientsController
);


/* ============================
   USER → FETCH MESSAGE HISTORY
============================ */
router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN", "DOCTOR", "PATIENT"),
  getMessagesController
);

/* ============================
   USER → MARK AS READ
============================ */
router.post(
  "/read",
  authMiddleware,
  roleMiddleware("ADMIN", "DOCTOR", "PATIENT"),
  markMessagesReadController
);

export default router;
