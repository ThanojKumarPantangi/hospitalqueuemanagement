import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Link refresh token to a specific session (device)
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      index: true,
    },

    // JWT ID
    jti: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // 🔐 Hashed refresh token (SHA256 of raw token)
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },

    // Expiry date (TTL index)
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Automatically deletes document when expiresAt is reached
    },

    revoked: {
      type: Boolean,
      default: false,
      index: true,
    },

    replacedByJti: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Optional helpful compound index for faster rotation lookups
refreshTokenSchema.index({ user: 1, session: 1, revoked: 1 });

export default mongoose.model("RefreshToken", refreshTokenSchema);
