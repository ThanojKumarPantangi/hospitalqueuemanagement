import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    token: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Token",
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    amount: {
      type: Number, // INR
      required: true,
    },

    currency: {
      type: String,
      default: "INR",
    },

    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },

    razorpayPaymentId: {
      type: String,
      unique: true,
      sparse: true,
    },

    razorpaySignature: {
      type: String,
    },

    status: {
      type: String,
      enum: ["CREATED", "SUCCESS", "FAILED", "REFUNDED"],
      default: "CREATED",
    },
    refund: {
        refundId: String,
        refundedAt: Date,
        reason: String,
    },


    appointmentDate: {
      type: Date,
      required: true,
    },

    meta: {
      priority: String,
      createdByRole: String,
    },
  },
  { timestamps: true }
);


paymentSchema.index({ user: 1, appointmentDate: 1 });

export default mongoose.model("Payment", paymentSchema);