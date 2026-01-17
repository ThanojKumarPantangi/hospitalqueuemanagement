import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // ⏱ Queue timing (ADMIN CONTROLLED)
    slotDurationMinutes: {
      type: Number,
      required: true,
      min: 5,
      max: 60,
      default: 10,
    },

    // 💰 Consultation fee (ADMIN CONTROLLED)
    consultationFee: {
      type: Number,
      required: true,
      min: 0,
    },

    maxCounters: {
      type: Number,
      default: 1,
      min: 1,
    },

    isOpen: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

departmentSchema.index({ isOpen: 1 });

export default mongoose.model("Department", departmentSchema);