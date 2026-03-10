import mongoose from "mongoose";

const consultationSessionSchema = new mongoose.Schema(
  {
    token: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Token",
      required: true,
      index: true
    },

    roomId: {
      type: String,
      required: true,
      unique: true
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    doctorJoined: {
      type: Boolean,
      default: false
    },

    patientJoined: {
      type: Boolean,
      default: false
    },

    active: {
      type: Boolean,
      default: true,
      index: true
    },

    startedAt: {
      type: Date,
      default: null
    },

    endedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

/* ---------- INDEXES ---------- */

consultationSessionSchema.index({
  token: 1,
  active: 1
});

consultationSessionSchema.index({
  doctor: 1,
  active: 1
});

consultationSessionSchema.index({
  patient: 1,
  active: 1
});

export default mongoose.model(
  "ConsultationSession",
  consultationSessionSchema
);