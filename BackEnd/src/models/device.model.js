import mongoose from "mongoose";

const deviceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    deviceId: {
      type: String,
      required: true,
    },
    
    deviceSecretHash: {
      type: String,
      required: true,
    },

    isTrusted: {
      type: Boolean,
      default: false,
    },

    trustExpiresAt: {
      type: Date,
    },

    userAgent: String,
    lastIp: String,
    lastCountry: String,

    lastUsedAt: {
      type: Date,
      default: Date.now,
    },

    revoked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Unique device per user
deviceSchema.index({ user: 1, deviceId: 1 }, { unique: true });

export default mongoose.model("Device", deviceSchema);