import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      index: true,
    },

    jti: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    tokenHash: {
      type: String,
      required: true,
      index: true,
    },


    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, 
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


refreshTokenSchema.index({ user: 1, session: 1, revoked: 1 });

export default mongoose.model("RefreshToken", refreshTokenSchema);
