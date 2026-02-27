import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    /* ============================
       MESSAGE ROUTING
    ============================ */
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    senderRole: {
      type: String,
      enum: ["ADMIN", "DOCTOR", "PATIENT", "SYSTEM"],
      required: true,
      index: true,
    },

    /* ============================
       THREADING (NEW)
    ============================ */
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
      default: null, // null = old one-way messages
    },

    /* ============================
       MESSAGE CLASSIFICATION
    ============================ */
    category: {
      type: String,
      enum: ["BILLING", "QUEUE", "COMPLAINT", "GENERAL"],
      default: "GENERAL",
      index: true,
    },

    // system-level type (keep for backward compatibility)
    type: {
      type: String,
      enum: ["ANNOUNCEMENT", "QUEUE", "PAYMENT", "GENERAL"],
      default: "GENERAL",
      index: true,
    },

    /* ============================
       CONTENT
    ============================ */
    title: {
      type: String,
      trim: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    /* ============================
       DELIVERY & READ STATE
    ============================ */
    deliveredAt: {
      type: Date,
      default: null,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },

    /* ============================
       METADATA (EXTENSIBLE)
    ============================ */
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

/* ============================
   INDEXES (IMPORTANT)
============================ */
messageSchema.index({ threadId: 1, createdAt: 1 });
messageSchema.index({ toUser: 1, readAt: 1 });
messageSchema.index({ category: 1, createdAt: -1 });
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Message", messageSchema);