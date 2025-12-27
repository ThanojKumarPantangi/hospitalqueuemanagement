import mongoose  from "mongoose";

const visitSchema=new mongoose.Schema(
{
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    token: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Token",
      required: true,
    },

    symptoms: {
      type: String,
    },

    diagnosis: {
      type: String,
    },

    prescriptions: [
      {
        medicineName: String,
        dosage: String,
        duration: String,
      },
    ],
  },
  { timestamps: true }
)

export default mongoose.model("Visit",visitSchema)