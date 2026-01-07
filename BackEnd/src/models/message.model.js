import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
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
    },

    senderRole: {
      type: String,
      enum: ["ADMIN", "SYSTEM"],
      required: true,
    },

    type: {
      type: String,
      enum: ["ANNOUNCEMENT", "QUEUE", "PAYMENT", "GENERAL"],
      default: "GENERAL",
    },

    title: {
      type: String,
      trim: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    readAt: {
      type: Date,
      default: null,
      index: true,
    },

    metadata: {
      type: Object, // optional: tokenId, departmentId, etc.
      default: {},
    },
  },
  { timestamps: true }
);



export default mongoose.model("Message", messageSchema);