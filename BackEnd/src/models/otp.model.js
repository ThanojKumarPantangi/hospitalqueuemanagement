import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      index: true, 
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
      attempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);


otpSchema.index({ phone: 1, createdAt: 1 });

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("OTP", otpSchema);
