import Token from "../models/token.model.js";
import Visit from "../models/visit.model.js";

/* -------------------- helpers -------------------- */
const getDayRange = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const getRangeFromQuery = (range) => {
  const now = new Date();

  if (range === "today") {
    return getDayRange(now);
  }

  if (range === "week") {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  if (range === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  // default: today
  return getDayRange(now);
};

const minutesBetween = (a, b) => {
  if (!a || !b) return null;
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000));
};

/* =========================================================
   1) Daily patient count (Visits created today)
   GET /api/analytics/daily-patient-count
========================================================= */
export const getDailyPatientCount = async (req, res) => {
  try {
    const { start, end } = getDayRange();

    const count = await Visit.countDocuments({
      createdAt: { $gte: start, $lte: end },
    });

    return res.status(200).json({ count });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

/* =========================================================
   2) Department load (WAITING tokens today)
   GET /api/analytics/department-load
========================================================= */
export const getDepartmentLoad = async (req, res) => {
  try {
    const { start, end } = getDayRange();

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
      { $sort: { waitingCount: -1 } },
    ]);

    return res.status(200).json({ data });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

/* =========================================================
   3) Doctor workload (Visits count by doctor)
   GET /api/analytics/doctor-workload?range=today|week|month
========================================================= */
export const getDoctorWorkload = async (req, res) => {
  try {
    const { range } = req.query;
    const { start, end } = getRangeFromQuery(range);

    const data = await Visit.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$doctor",
          patientsHandled: { $sum: 1 },
        },
      },
      { $sort: { patientsHandled: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "doctor",
        },
      },
      { $unwind: "$doctor" },
      {
        $project: {
          _id: 0,
          doctorId: "$doctor._id",
          doctorName: "$doctor.name",
          patientsHandled: 1,
        },
      },
    ]);

    return res.status(200).json({ data });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

/* =========================================================
   4) Average waiting time (today)
   waiting = calledAt - createdAt
   GET /api/analytics/waiting-time/today
========================================================= */
export const getTodayAvgWaitingTime = async (req, res) => {
  try {
    const { start, end } = getDayRange();

    // only tokens that were called today
    const tokens = await Token.find({
      appointmentDate: { $gte: start, $lte: end },
      calledAt: { $ne: null },
    }).select("createdAt calledAt");

    if (!tokens.length) {
      return res.json({
        avgWaitingMinutes: 0,
        totalCalled: 0,
      });
    }

    const waits = tokens
      .map((t) => minutesBetween(t.createdAt, t.calledAt))
      .filter((x) => x !== null);

    const total = waits.reduce((a, b) => a + b, 0);
    const avg = Math.round(total / waits.length);

    return res.json({
      avgWaitingMinutes: avg,
      totalCalled: waits.length,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

/* =========================================================
   5) Consultation time (NOT possible accurately)
   Because Visit schema has no startedAt/endedAt.
   GET /api/analytics/consultation-time
========================================================= */
export const getConsultationTime = async (req, res) => {
  return res.status(501).json({
    message:
      "Consultation time cannot be calculated because Visit model does not store startedAt/endedAt. Add these fields to enable this analytics.",
  });
};

/* =========================================================
   6) Department peak hours (for a date)
   GET /api/analytics/department-peak-hours?date=YYYY-MM-DD
========================================================= */
export const getDepartmentPeakHours = async (req, res) => {
  try {
    const { date } = req.query;

    const base = date ? new Date(date) : new Date();
    const { start, end } = getDayRange(base);

    const data = await Token.aggregate([
      {
        $match: {
          appointmentDate: { $gte: start, $lte: end },
        },
      },
      {
        $project: {
          department: 1,
          hour: { $hour: "$createdAt" },
        },
      },
      {
        $group: {
          _id: { department: "$department", hour: "$hour" },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "_id.department",
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
          hour: "$_id.hour",
          count: 1,
        },
      },
      { $sort: { departmentName: 1, hour: 1 } },
    ]);

    return res.json({ date: start.toISOString().slice(0, 10), data });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

/* =========================================================
   7) Throughput (created vs served vs waiting)
   GET /api/analytics/throughput?range=today|week|month
========================================================= */
export const getThroughput = async (req, res) => {
  try {
    const { range } = req.query;
    const { start, end } = getRangeFromQuery(range);

    const totalCreated = await Token.countDocuments({
      appointmentDate: { $gte: start, $lte: end },
    });

    const totalCompleted = await Token.countDocuments({
      appointmentDate: { $gte: start, $lte: end },
      status: "COMPLETED",
    });

    const totalWaiting = await Token.countDocuments({
      appointmentDate: { $gte: start, $lte: end },
      status: "WAITING",
    });

    const totalCalled = await Token.countDocuments({
      appointmentDate: { $gte: start, $lte: end },
      status: "CALLED",
    });

    return res.json({
      range: range || "today",
      totalCreated,
      totalCompleted,
      totalWaiting,
      totalCalled,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

/* =========================================================
   8) Cancellation / no-show rate
   GET /api/analytics/cancel-rate?range=week|month|today
========================================================= */
export const getCancelRate = async (req, res) => {
  try {
    const { range } = req.query;
    const { start, end } = getRangeFromQuery(range);

    const total = await Token.countDocuments({
      appointmentDate: { $gte: start, $lte: end },
    });

    const cancelled = await Token.countDocuments({
      appointmentDate: { $gte: start, $lte: end },
      status: "CANCELLED",
    });

    const noShow = await Token.countDocuments({
      appointmentDate: { $gte: start, $lte: end },
      status: "NO_SHOW",
    });

    const cancelRate = total === 0 ? 0 : Math.round((cancelled / total) * 100);
    const noShowRate = total === 0 ? 0 : Math.round((noShow / total) * 100);

    return res.json({
      range: range || "today",
      total,
      cancelled,
      noShow,
      cancelRatePercent: cancelRate,
      noShowRatePercent: noShowRate,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

/* =========================================================
   9) Doctor utilization (patients handled per doctor)
   GET /api/analytics/doctor-utilization?range=today|week|month
========================================================= */
export const getDoctorUtilization = async (req, res) => {
  try {
    const { range } = req.query;
    const { start, end } = getRangeFromQuery(range);

    const data = await Visit.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$doctor",
          patientsHandled: { $sum: 1 },
        },
      },
      { $sort: { patientsHandled: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "doctor",
        },
      },
      { $unwind: "$doctor" },
      {
        $project: {
          _id: 0,
          doctorId: "$doctor._id",
          doctorName: "$doctor.name",
          patientsHandled: 1,
        },
      },
    ]);

    return res.json({ range: range || "today", data });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

/* =========================================================
   10) Live queue snapshot (Admin dashboard)
   GET /api/analytics/live-queue
========================================================= */
export const getLiveQueueSnapshot = async (req, res) => {
  try {
    const { start, end } = getDayRange();

    const data = await Token.aggregate([
      {
        $match: {
          appointmentDate: { $gte: start, $lte: end },
          status: { $in: ["WAITING", "CALLED"] },
        },
      },
      {
        $group: {
          _id: { department: "$department", status: "$status" },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "_id.department",
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
          status: "$_id.status",
          count: 1,
        },
      },
      { $sort: { departmentName: 1 } },
    ]);

    // Convert to clean format per department
    const map = {};
    for (const row of data) {
      const key = row.departmentId.toString();
      if (!map[key]) {
        map[key] = {
          departmentId: row.departmentId,
          departmentName: row.departmentName,
          waiting: 0,
          called: 0,
        };
      }
      if (row.status === "WAITING") map[key].waiting = row.count;
      if (row.status === "CALLED") map[key].called = row.count;
    }

    return res.json({
      date: start.toISOString().slice(0, 10),
      departments: Object.values(map),
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

/* =========================================================
   11) Patient trend (visits per day)
   GET /api/analytics/patient-trend?days=7|30
========================================================= */
export const getPatientTrend = async (req, res) => {
  try {
    const days = Number(req.query.days || 7);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const data = await Visit.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $project: {
          day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        },
      },
      {
        $group: {
          _id: "$day",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return res.json({
      days,
      start: start.toISOString(),
      end: end.toISOString(),
      data: data.map((d) => ({ date: d._id, count: d.count })),
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};