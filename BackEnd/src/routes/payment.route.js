import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import { createPaymentOrderController,verifyPaymentController } from "../controllers/payment.controller.js";

const router = express.Router();

router.post(
  "/create-order",
  authMiddleware,
  roleMiddleware("PATIENT", "ADMIN"),
  createPaymentOrderController
);


router.post(
  "/verify",
  authMiddleware,
  roleMiddleware("PATIENT", "ADMIN"),
  verifyPaymentController
);


export default router;