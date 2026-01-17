import mongoose from "mongoose";

const doctorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
    },
    qualifications: [
      {
        type: String,
        trim: true,
      },
    ],

    experienceYears: {
      type: Number,
      min: 0,
      max: 60,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
      index: true,
    },

    opdTimings: [
      {
        day: {
        type: String,
        enum: ["MON","TUE","WED","THU","FRI","SAT","SUN"],
        required: true,
        },
        startTime: {
          type: String,
          required: true,
        },
        endTime: {
          type: String, 
          required: true,
        },
      },
    ],
    bio: {
      type: String,
      maxlength: 500,
    },
  },
  { timestamps: true }
);
doctorProfileSchema.index({ specialization: 1 });
export default mongoose.model("DoctorProfile", doctorProfileSchema);
