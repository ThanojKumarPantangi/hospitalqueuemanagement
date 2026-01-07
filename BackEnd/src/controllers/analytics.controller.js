import Token from "../models/token.model.js";
import Visit from "../models/visit.model.js";
import Payment from "../models/payment.model.js";
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
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const data = await Token.aggregate([
      {
        $match: {
          status: "WAITING",
          appointmentDate: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$department",
          waitingCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "_id",
          foreignField: "_id",
          as: "department",
        },
      },
      { $unwind: "$department" },
      {
        $project: {
          _id: 0,
          departmentId: "$department._id",
          departmentName: "$department.name",
          waitingCount: 1,
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

export const getTodayRevenue = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const data = await Payment.aggregate([
      {
        $match: {
          status: "SUCCESS",
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          totalPayments: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json(
      data[0] || { totalRevenue: 0, totalPayments: 0 }
    );
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getRevenueByDepartment = async (req, res) => {
  try {
    const data = await Payment.aggregate([
      { $match: { status: "SUCCESS" } },
      {
        $group: {
          _id: "$department",
          revenue: { $sum: "$amount" },
          payments: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "_id",
          foreignField: "_id",
          as: "department",
        },
      },
      { $unwind: "$department" },
      {
        $project: {
          _id: 0,
          departmentId: "$department._id",
          departmentName: "$department.name",
          revenue: 1,
          payments: 1,
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    res.status(200).json({ data });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getPaymentStats = async (req, res) => {
  try {
    const data = await Payment.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({ data });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
