import mongoose from "mongoose";
import Medicine from "../../models/medicine.model.js";

/* ---------------- Create Medicine ---------------- */

export const createMedicine = async (data) => {
  try {
    if (!data || Object.keys(data).length === 0) {
      throw new Error("Medicine data is required");
    }

    const medicine = await Medicine.create(data);
    return medicine;
  } catch (error) {
     if (error.code === 11000) {
      throw new Error("Medicine already exists");
   }
    throw new Error(`Failed to create medicine: ${error.message}`);
  }
};

/* ---------------- Search Medicine (Autocomplete) ---------------- */

export const searchMedicines = async (query) => {
  try {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const medicines = await Medicine.find({
      isActive: true,
      name: { $regex: `^${query.trim()}`, $options: "i" }
    }).limit(10);

    const flattened = medicines.flatMap((medicine) =>
      medicine.variants.map((variant) => ({
        medicineId: medicine._id,
        name: medicine.name,
        form: variant.form,
        strength: variant.strength,
        defaultDosage: variant.defaultDosage || "",
        defaultFrequency: variant.defaultFrequency || "",
        defaultInstructions: variant.defaultInstructions || ""
      }))
    );

    return flattened;

  } catch (error) {
    throw new Error(`Failed to search medicines: ${error.message}`);
  }
};

/* ---------------- Get Medicine By ID ---------------- */

export const getMedicineById = async (id) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid medicine ID");
    }

    const medicine = await Medicine.findById(id);

    if (!medicine) {
      throw new Error("Medicine not found");
    }

    return medicine;
  } catch (error) {
    throw new Error(`Failed to fetch medicine: ${error.message}`);
  }
};

/* ---------------- Update Medicine ---------------- */

export const updateMedicine = async (id, data) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  const updated = await Medicine.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  );

  return updated;
};

/* ---------------- Delete Medicine (Soft Delete) ---------------- */

export const deleteMedicine = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  const deleted = await Medicine.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  return deleted;
};

/* ---------------- Get All Medicines (Paginated) ---------------- */

export const getAllMedicines = async ({
  page = 1,
  limit = 10,
  search = "",
  isActive,
  sortBy = "createdAt",
  order = "desc",
}) => {
  const query = {};

  // Optional active filter
  if (typeof isActive !== "undefined") {
    query.isActive = isActive === "true";
  }

  // Optional search
  if (search && search.trim().length > 0) {
    query.name = { $regex: search.trim(), $options: "i" };
  }

  const skip = (page - 1) * limit;

  const sortOrder = order === "asc" ? 1 : -1;

  const [medicines, total] = await Promise.all([
    Medicine.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit)),

    Medicine.countDocuments(query),
  ]);

  return {
    medicines,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
  };
};