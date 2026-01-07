import express from "express";
import { razorpayWebhookController } from "../controllers/payment.webhook.controller.js";

const router = express.Router();

router.post("/webhook", razorpayWebhookController);

export default router;
