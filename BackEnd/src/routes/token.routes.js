import express from "express";

import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import {tokenLimiter} from "../middlewares/rateLimiter.middleware.js";
import {
    callNextTokenController,
    createTokenController,
    completeCurrentTokenController,
    skipCurrentTokenController,
    cancelTokenController,
    getMyCurrentTokenController,
    getMyUpcomingTokens,
    previewTokenNumber,
    getPatientTokenHistoryController,
    getDoctorQueueSummaryController
} from "../controllers/token.controller.js";

const router=express.Router();

router.post("/",
  tokenLimiter,
  authMiddleware,
  roleMiddleware("PATIENT", "ADMIN"),
  createTokenController
);

router.post(
  "/doctor/call-next",
  authMiddleware,
  roleMiddleware("DOCTOR"),
  callNextTokenController
);

router.post(
  "/doctor/complete",
  authMiddleware,
  roleMiddleware("DOCTOR"),
  completeCurrentTokenController
);

router.post(
  "/doctor/skip",
  authMiddleware,
  roleMiddleware("DOCTOR"),
  skipCurrentTokenController
);


router.patch(
  "/:id/cancel",
  authMiddleware,
  roleMiddleware("ADMIN","PATIENT"),
  cancelTokenController
);


router.get(
  "/my",
  authMiddleware,
  roleMiddleware("PATIENT"),
  getMyCurrentTokenController
);

router.get(
  "/my/upcoming",
  authMiddleware,
  roleMiddleware("PATIENT"),
  getMyUpcomingTokens
);

router.get("/preview", 
  authMiddleware,
  roleMiddleware("ADMIN","PATIENT"),
  previewTokenNumber
);

router.get(
  "/history",
  authMiddleware,
  roleMiddleware("PATIENT"),
  getPatientTokenHistoryController
);

router.get(
  "/dashboard/queue-summary",
  authMiddleware,
  roleMiddleware("DOCTOR","ADMIN"),
  getDoctorQueueSummaryController
);

export default router;