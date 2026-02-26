import mongoose from "mongoose";

const userSecuritySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    failedLoginAttempts: {
      type: Number,
      default: 0,
    },

    twoStepEnabled: {
        type: Boolean,
        default: false,
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
    },

    mfaSecret: {
      type: String,
    },

    mfaRecoveryCodes: [
      {
        type: String,
      },
    ],

    mfaTempSecret: {
      type: String,
    },

    mfaTempTokenId: {
      type: String,
    },

    failedMfaAttempts: {
      type: Number,
      default: 0,
    },

    mfaLockedUntil: {
      type: Date,
    },

    lastLoginIp: {
      type: String,
    },

    lastLoginCountry: {
      type: String,
    },

    lastLoginAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// one security record per user
userSecuritySchema.index({ user: 1 }, { unique: true });

export default mongoose.model("UserSecurity", userSecuritySchema);