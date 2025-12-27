import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    token: {
      type: String,
      required: true,
      unique: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, 
    },

    revoked: {
      type: Boolean,
      default: false,
    },
    replacedByToken: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("RefreshToken", refreshTokenSchema);
