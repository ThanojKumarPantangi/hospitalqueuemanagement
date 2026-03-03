import mongoose from "mongoose";
import PrescriptionTemplate from "../../models/prescriptionTemplate.model.js";

/* ---------------- Create Template ---------------- */

export const createTemplate = async (doctorId, data) => {
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    return null;
  }

  const template = await PrescriptionTemplate.create({
    ...data,
    doctor: doctorId,
  });

  return template;
};

/* ---------------- Get Doctor Templates ---------------- */

export const getDoctorTemplates = async (doctorId) => {
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    return null;
  }

  const templates = await PrescriptionTemplate.find({
    doctor: doctorId,
    isActive: true,
  })
    .populate("medicines.medicine")
    .sort({ createdAt: -1 }); 

  return templates;
};

/* ---------------- Delete Template (Soft Delete) ---------------- */

export const deleteTemplate = async (doctorId, templateId) => {
  if (
    !mongoose.Types.ObjectId.isValid(doctorId) ||
    !mongoose.Types.ObjectId.isValid(templateId)
  ) {
    return null;
  }

  const updatedTemplate = await PrescriptionTemplate.findOneAndUpdate(
    {
      _id: templateId,
      doctor: doctorId,
      isActive: true,
    },
    { isActive: false },
    { new: true }
  );

  return updatedTemplate; // null if not found
};

/* ---------------- Update Template ---------------- */

export const updateTemplate = async (doctorId, templateId, data) => {
  if (
    !mongoose.Types.ObjectId.isValid(doctorId) ||
    !mongoose.Types.ObjectId.isValid(templateId)
  ) {
    return null;
  }

  const updated = await PrescriptionTemplate.findOneAndUpdate(
    {
      _id: templateId,
      doctor: doctorId,
      isActive: true,
    },
    { $set: data },
    { new: true, runValidators: true }
  );

  return updated;
};

/* ---------------- Match Template Medicine ---------------- */

export const matchTemplateMedicine = async (
  doctorId,
  medicineId,
  form,
  strength
) => {
  if (
    !mongoose.Types.ObjectId.isValid(doctorId) ||
    !mongoose.Types.ObjectId.isValid(medicineId)
  ) {
    return null;
  }

  const template = await PrescriptionTemplate.findOne(
    {
      doctor: doctorId,
      isActive: true,
      "medicines.medicine": medicineId,
      "medicines.variant.form": form,
      "medicines.variant.strength": strength,
    },
    {
      defaultFollowUpDays: 1,  
      medicines: {
        $elemMatch: {
          medicine: medicineId,
          "variant.form": form,
          "variant.strength": strength,
        },
      },
    }
  ).lean();

  if (!template || !template.medicines || template.medicines.length === 0) {
    return null;
  }
  
  const matchedMedicine = template.medicines[0];

  return {
    dosage: matchedMedicine.dosage || null,
    frequency: matchedMedicine.frequency || null,
    duration: matchedMedicine.duration || null,
    instructions: matchedMedicine.instructions || null,
    followUpDays:template.defaultFollowUpDays || null,

  };
};