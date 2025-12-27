import Department from "../models/department.model.js";

export const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find(
      { isOpen: true },
      { name: 1 }
    );

    res.status(200).json(departments);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};
