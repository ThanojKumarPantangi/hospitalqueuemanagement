import Token from "../models/token.model.js";
import Department from "../models/department.model.js";


const getTodayDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};


export const getDepartmentQueueStatus = async (req, res) => {
  try {
    const today = getTodayDate();
    const { departmentId } = req.params;

    const department = await Department.findById(departmentId);
    if (!department || !department.isOpen) {
      return res.status(404).json({
        message: "Department not available",
      });
    }

    const currentToken = await Token.findOne({
      department: departmentId,
      status: "CALLED",
      appointmentDate: today,
    })
      .sort({ updatedAt: -1 })
      .populate("assignedDoctor", "name");

    const waitingCount = await Token.countDocuments({
      department: departmentId,
      status: "WAITING",
      appointmentDate: today,
    });

    res.status(200).json({
      department: department.name,
      currentToken: currentToken
        ? {
            tokenNumber: currentToken.tokenNumber,
            doctor: currentToken.assignedDoctor?.name || null,
          }
        : null,
      waitingCount,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const getAllDepartmentsStatus = async (req, res) => {
  try {
    const today = getTodayDate();
    const departments = await Department.find({ isOpen: true });

    const data = [];

    for (const dept of departments) {
      const currentToken = await Token.findOne({
        department: dept._id,
        status: "CALLED",
        appointmentDate: today,
      }).sort({ updatedAt: -1 });

      const waitingCount = await Token.countDocuments({
        department: dept._id,
        status: "WAITING",
        appointmentDate: today,
      });

      data.push({
        departmentId: dept._id,
        departmentName: dept.name,
        currentToken: currentToken
          ? currentToken.tokenNumber
          : null,
        waitingCount,
      });
    }

    res.status(200).json({ data });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};