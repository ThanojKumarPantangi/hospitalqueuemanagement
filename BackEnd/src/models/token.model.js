import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema(
  {
    tokenNumber: {
      type: Number,
      required: true,
    },

    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
      index: true,
    },

    priority: {
      type: String,
      enum: ["NORMAL", "SENIOR", "EMERGENCY"],
      default: "NORMAL",
      index: true,
    },
    priorityRank: {
      type: Number,
      enum: [1, 2, 3],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        "WAITING",
        "CALLED",
        "SKIPPED",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
      ],
      default: "WAITING",
      index: true,
    },

    assignedDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    appointmentDate: {
      type: Date,
      required: true,
      index: true,
    },

    calledAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);
// tokenNumber is unique PER department PER appointmentDate
tokenSchema.index(
  { department: 1, appointmentDate: 1, tokenNumber: 1 },
  { unique: true }
);
// 🔹 Queue fetch optimization (doctor calling next patient)
tokenSchema.index({
  department: 1,
  appointmentDate: 1,
  status: 1,
  priorityRank: 1,
  createdAt: 1,
});

// 🔹 Patient active token lookup
tokenSchema.index({
  patient: 1,
  appointmentDate: 1,
  status: 1,
});

export default mongoose.model("Token", tokenSchema);