import crypto from "crypto";
import Payment from "../models/payment.model.js";
import { createToken } from "../services/token.service.js";

export const razorpayWebhookController = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(req.body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(400).json({ message: "Invalid webhook signature" });
    }

    const event = JSON.parse(req.body.toString());

    /* ===============================
       PAYMENT CAPTURED EVENT
    ================================ */
    if (event.event === "payment.captured") {
      const razorpayOrderId = event.payload.payment.entity.order_id;
      const razorpayPaymentId = event.payload.payment.entity.id;

      const payment = await Payment.findOne({
        razorpayOrderId,
      });

      if (!payment) return res.status(200).json({ ok: true });

      // 🔁 Idempotency
      if (payment.status === "SUCCESS") {
        return res.status(200).json({ ok: true });
      }

      payment.status = "SUCCESS";
      payment.razorpayPaymentId = razorpayPaymentId;

      // 🧠 Create token ONLY if not created
      if (!payment.token) {
        const token = await createToken({
          patientId: payment.user,
          departmentId: payment.department,
          requestedPriority: payment.meta?.priority || "NORMAL",
          createdByRole: payment.meta?.createdByRole || "PATIENT",
          appointmentDate: payment.appointmentDate,
        });

        payment.token = token._id;
      }

      await payment.save();
    }

    res.status(200).json({ received: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
