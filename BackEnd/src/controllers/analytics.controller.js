import Token from "../models/token.model.js";
import Visit from "../models/visit.model.js";
import Department from "../models/department.model.js";
import User from "../models/user.model.js";


export const getDailyPatientCount = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const count = await Visit.countDocuments({
      createdAt: { $gte: start, $lte: end },
    });

    res.status(200).json({ count });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const getDepartmentLoad = async (req, res) => {
  try {
    const data = await Token.aggregate([
      {
        $match: { status: "WAITING" },
      },
      {
        $group: {
          _id: "$department",
          waitingCount: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({ data });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const getDoctorWorkload = async (req, res) => {
  try {
    const data = await Visit.aggregate([
      {
        $group: {
          _id: "$doctor",
          patientsHandled: { $sum: 1 },
        },
      },
      { $sort: { patientsHandled: -1 } },
    ]);

    res.status(200).json({ data });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
