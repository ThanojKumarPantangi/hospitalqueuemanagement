import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: function () {
        return this.role !== "DOCTOR";
      },
      select: false,
    },


    phone: {
      type: String,
      unique: true,
      sparse: true,
      required: function () {
        return this.role !== "DOCTOR";
      },
    },


    role: {
      type: String,
      enum: ["PATIENT", "DOCTOR", "ADMIN"],
      required: true,
    },

    doctorRollNo: {
      type: String,
      unique: true,
      sparse: true,
      required: function () {
        return this.role === "DOCTOR";
      },
    },

    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: function () {
        return this.role !== "DOCTOR";
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    departments: 
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
      },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// 🔹 Doctor dashboard stats
userSchema.index({
  role: 1,
  isVerified: 1,
  isActive: 1,
  isAvailable: 1,
});

userSchema.index({
  role: 1,
  departments: 1,
});

export default mongoose.model("User", userSchema);