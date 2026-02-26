import mongoose from "mongoose";

const securityEventSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "SUSPICIOUS_LOGIN",
        "BLOCKED_LOGIN",
        "NEW_DEVICE",
        "DEVICE_EXPIRED",
        "COUNTRY_CHANGE",
      ],
      required: true,
    },

    ip: String,
    country: String,
    deviceId: String,
    userAgent: String,

    riskScore: Number,

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("SecurityEvent", securityEventSchema);