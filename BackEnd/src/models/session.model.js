import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: String,
    device: String,
    ipAddress: String,

    isActive: {
      type: Boolean,
      default: true,
    },

    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// 🧹 AUTO DELETE after 10 days of inactivity
sessionSchema.index(
  { lastSeenAt: 1 },
  { expireAfterSeconds: 10 * 24 * 60 * 60 }
);


export default mongoose.model("Session", sessionSchema);