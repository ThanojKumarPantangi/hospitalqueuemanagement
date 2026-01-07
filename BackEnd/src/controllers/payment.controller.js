// import razorpay from "../config/razorpay.js";
import Payment from "../models/payment.model.js";
import crypto from "crypto";
import { createToken } from "../services/token.service.js";
import Token from "../models/token.model.js";
import Department from "../models/department.model.js";

const getStartOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const createPaymentOrderController = async (req, res) => {
  try {
    const {
      departmentId,
      appointmentDate,
      priority = "NORMAL",
    } = req.body;

    /* =========================
       1️⃣ Department validation
    ========================== */
    const department = await Department.findById(departmentId);
    if (!department || !department.isOpen) {
      return res.status(400).json({
        message: "Department is not open",
      });
    }

    /* =========================
       2️⃣ Appointment date validation
    ========================== */
    const today = getStartOfDay();
    const selectedDate = getStartOfDay(appointmentDate);

    const diffDays =
      (selectedDate - today) / (1000 * 60 * 60 * 24);

    if (diffDays < 0) {
      return res.status(400).json({
        message: "Cannot book past dates",
      });
    }

    if (diffDays > MAX_ADVANCE_DAYS) {
      return res.status(400).json({
        message: `Booking allowed only ${MAX_ADVANCE_DAYS} days ahead`,
      });
    }

    /* =========================
       3️⃣ One active token per day check
    ========================== */
    const existing = await Token.findOne({
      patient: req.user._id,
      appointmentDate: selectedDate,
      status: { $in: ["WAITING", "CALLED"] },
    });

    if (existing) {
      return res.status(400).json({
        message: "Patient already has an active token for this day",
      });
    }

    /* =========================
       4️⃣ Priority control (server-side)
    ========================== */
    let finalPriority = "NORMAL";
    if (
      req.user.role === "ADMIN" &&
      ["SENIOR", "EMERGENCY"].includes(priority)
    ) {
      finalPriority = priority;
    }

    /* =========================
       5️⃣ Decide amount (safe)
    ========================== */
    const amount = 200; // INR (static for now)

    /* =========================
       6️⃣ Create Razorpay order
    ========================== */
    const order = await razorpay.orders.create({
      amount: amount * 100, // paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    /* =========================
       7️⃣ Save payment record
    ========================== */
    await Payment.create({
      user: req.user._id,
      department: departmentId,
      appointmentDate: selectedDate,
      amount,
      razorpayOrderId: order.id,
      meta: {
        priority: finalPriority,
        createdByRole: req.user.role,
      },
    });

    /* =========================
       8️⃣ Respond to frontend
    ========================== */
    res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const verifyPaymentController = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;


    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (!payment) {
      return res.status(404).json({
        message: "Payment record not found",
      });
    }

    if (payment.status === "SUCCESS") {
      return res.status(200).json({
        message: "Payment already verified",
        token: payment.token,
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      payment.status = "FAILED";
      await payment.save();

      return res.status(400).json({
        message: "Invalid payment signature",
      });
    }

    if (payment.token) {
        return res.status(200).json({
            message: "Token already created",
            token: payment.token,
    });
    }

    payment.status = "SUCCESS";
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;

    const token = await createToken({
        patientId: payment.user,
        departmentId: payment.department,
        requestedPriority: payment.meta?.priority || "NORMAL",
        createdByRole: payment.meta?.createdByRole || req.user.role,
        appointmentDate: payment.appointmentDate,
    });


    payment.token = token._id;
    await payment.save();

    res.status(201).json({
      message: "Payment verified and token created",
      token,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};
