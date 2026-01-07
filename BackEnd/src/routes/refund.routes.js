import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import { refundPaymentController } from "../controllers/refund.controller.js";

const router = express.Router();

router.post(
  "/:paymentId",
  authMiddleware,
  roleMiddleware("ADMIN"), // usually admin-only
  refundPaymentController
);

export default router;
