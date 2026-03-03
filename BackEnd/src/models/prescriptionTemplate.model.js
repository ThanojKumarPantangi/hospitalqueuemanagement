import mongoose from "mongoose";

const { Schema, model } = mongoose;

const templateMedicineSchema = new Schema(
  {
    medicine: {
      type: Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
    },

    variant: {
      form: { type: String },
      strength: { type: String },
    },

    dosage: {
      type: String,
      trim: true,
    },

    frequency: {
      type: String,
      trim: true,
    },

    duration: {
      type: String,
      trim: true,
    },

    instructions: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const prescriptionTemplateSchema = new Schema(
  {
    doctor: {
      type: Schema.Types.ObjectId,
      ref: "User", 
      required: true,
      index: true,
    },

    name: {
      type: String, 
      required: true,
      trim: true,
    },

    defaultDiagnosis: {
      type: String,
      trim: true,
    },

    defaultFollowUpDays: {
      type: Number,
    },

    medicines: [templateMedicineSchema],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);


prescriptionTemplateSchema.index({ doctor: 1, name: 1 }, { unique: true });

export default model("PrescriptionTemplate", prescriptionTemplateSchema);