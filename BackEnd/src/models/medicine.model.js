import mongoose from "mongoose";

const { Schema, model } = mongoose;

const medicineVariantSchema = new Schema(
  {
    form: {
      type: String, 
      required: true,
      trim: true,
    },
    strength: {
      type: String, 
      required: true,
      trim: true,
    },
    defaultDosage: {
      type: String,
      trim: true,
    },
    defaultFrequency: {
      type: String,
      trim: true,
    },
    defaultInstructions: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const medicineSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    genericName: {
      type: String,
      trim: true,
    },

    category: {
      type: String, 
      trim: true,
    },

    variants: [medicineVariantSchema],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

medicineSchema.index({ name: "text", genericName: "text" });

medicineSchema.index(
  { name: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);
export default model("Medicine", medicineSchema);