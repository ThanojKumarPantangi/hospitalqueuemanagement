import Payment from "../models/payment.model.js";
import Token from "../models/token.model.js";
// import razorpay from "../config/razorpay.js";

export const refundPaymentController = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason = "User requested refund" } = req.body;

    const payment = await Payment.findById(paymentId).populate("token");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    /* =========================
       1️⃣ State checks
    ========================== */
    if (payment.status !== "SUCCESS") {
      return res.status(400).json({
        message: "Only successful payments can be refunded",
      });
    }

    if (payment.status === "REFUNDED") {
      return res.status(200).json({
        message: "Payment already refunded",
      });
    }

    /* =========================
       2️⃣ Token safety check
    ========================== */
    if (payment.token) {
      const tokenUsed =
        payment.token.status === "CALLED" ||
        payment.token.status === "COMPLETED";

      if (tokenUsed) {
        return res.status(400).json({
          message: "Cannot refund after token is used",
        });
      }
    }

    /* =========================
       3️⃣ Razorpay refund
    ========================== */
    const refund = await razorpay.payments.refund(
      payment.razorpayPaymentId,
      {
        amount: payment.amount * 100, // paise
        notes: { reason },
      }
    );

    


    /* =========================
       4️⃣ Update DB
    ========================== */
    payment.status = "REFUNDED";
    payment.refund = {
      refundId: refund.id,
      refundedAt: new Date(),
      reason,
    };

    if (payment.token) {
        await Token.findByIdAndUpdate(payment.token._id, {
            status: "CANCELLED",
        });
    }
    
    await payment.save();

    res.status(200).json({
      message: "Refund processed successfully",
      refundId: refund.id,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};
