import Department from "../models/department.model.js";

export const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find(
      { isOpen: true },
      { name: 1, consultationFee: 1, slotDurationMinutes: 1 }
    ).lean();

    return res.status(200).json({
      success: true,
      departments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch departments",
    });
  }
};
