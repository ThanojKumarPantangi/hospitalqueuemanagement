import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    role: {
      type: String,
      required: true,
      enum: ["PATIENT", "DOCTOR", "ADMIN"],
    },

    device: {
      type: String,
      default: null,
    },

    ipAddress: {
      type: String,
      default: null,
    },

    location: {
      city: { type: String, default: null },
      region: { type: String, default: null },
      country: { type: String, default: null },
      timezone: { type: String, default: null },
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

sessionSchema.index({ user: 1, isActive: 1 });

sessionSchema.index(
  { lastSeenAt: 1 },
  { expireAfterSeconds: 10 * 24 * 60 * 60 }
);

export default mongoose.model("Session", sessionSchema);
