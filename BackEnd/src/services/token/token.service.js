import Token from "../../models/token.model.js";
import Department from "../../models/department.model.js";
import User from "../../models/user.model.js";
import Visit from "../../models/visit.model.js";
import { getIO } from "../../sockets/index.js";

import { calculateWaitingTime } from "../../utils/waitingTime.util.js";
import DoctorProfile from "../../models/doctorProfile.model.js";

import redis from "../../config/redisClient.js";
import { getQueueKey, getScore } from "../../redis/queue.redis.js";

/* ===================== CONSTANTS ===================== */

const MAX_ADVANCE_DAYS = 5;
const MAX_RETRIES = 3;

// Explicit state machine
const TOKEN_STATES = {
  WAITING: ["CALLED", "CANCELLED"],
  CALLED: ["COMPLETED", "SKIPPED", "NO_SHOW"],
  SKIPPED: [],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

const PRIORITY_ORDER = {
  EMERGENCY: 3,
  SENIOR: 2,
  NORMAL: 1,
};

/* ===================== UTILS ===================== */
const getStartOfISTDay = (date = new Date()) => {
  const d = new Date(date);

  // Convert to IST by adding 5:30
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(d.getTime() + istOffsetMs);

  // Start of IST day
  istDate.setHours(0, 0, 0, 0);

  // Convert back to UTC Date object for DB match
  return new Date(istDate.getTime() - istOffsetMs);
};

const isTransitionAllowed = (from, to) =>
  TOKEN_STATES[from]?.includes(to);

/* ===================== SOCKET EMITTER ===================== */
const emit = (event, departmentId, payload = {}) => {
  const io = getIO();
  io.to(departmentId.toString()).emit(event, payload);
  io.to("admin-monitor").emit("ADMIN_TOKEN_UPDATE", {
    departmentId: departmentId.toString(),
    action: event,
    ...payload,
  });
};

/* ===================== CREATE TOKEN ===================== */
export const createToken = async ({
  patientId,
  departmentId,
  requestedPriority = "NORMAL",
  createdByRole,
  appointmentDate,
}) => {
  const department = await Department.findById(departmentId);
  if (!department || !department.isOpen) {
    throw new Error("Department is not open");
  }

  const doctors = await User.find({
    departments: departmentId,
    isActive: true,
    role: "DOCTOR",
  });

  if (!doctors || doctors.length === 0) {
    throw new Error("No doctors available in this department");
  }

  //  Normalize to IST day start (stored in DB as UTC equivalent)
  const today = getStartOfISTDay(new Date());
  const dayStart = getStartOfISTDay(appointmentDate);

  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  //  Date validation (based on IST day)
  const diffDays = (dayStart - today) / (1000 * 60 * 60 * 24);

  if (diffDays < 0) throw new Error("Cannot book past dates");
  if (diffDays > MAX_ADVANCE_DAYS) {
    throw new Error(`Booking allowed only ${MAX_ADVANCE_DAYS} days ahead`);
  }

  //  one active token per patient per IST day (range match)
  const existing = await Token.findOne({
    patient: patientId,
    appointmentDate: { $gte: dayStart, $lt: dayEnd },
    status: { $in: ["WAITING", "CALLED"] },
  });

  if (existing) {
    throw new Error("Patient already has an active token for this day");
  }

  //  Priority control
  let finalPriority = "NORMAL";
  if (
    createdByRole === "ADMIN" &&
    ["SENIOR", "EMERGENCY"].includes(requestedPriority)
  ) {
    finalPriority = requestedPriority;
  }

  //  safe tokenNumber generation with retry
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Find last token for this department in the same IST day
      const lastToken = await Token.findOne({
        department: departmentId,
        appointmentDate: { $gte: dayStart, $lt: dayEnd },
      })
        .sort({ tokenNumber: -1 })
        .select("tokenNumber")
        .lean();

      const nextTokenNumber = lastToken ? lastToken.tokenNumber + 1 : 1;

      //  Create token with appointmentDate stored as dayStart (consistent)
      const token = await Token.create({
        tokenNumber: nextTokenNumber,
        patient: patientId,
        department: departmentId,
        priority: finalPriority,
        priorityRank: PRIORITY_ORDER[finalPriority],
        appointmentDate: dayStart,
      });

      try {
        const queueKey = getQueueKey(departmentId, dayStart);
        const cacheKey = `expectedToken:${departmentId}:${dayStart.toISOString().slice(0,10)}`;
        await redis.set(cacheKey, nextTokenNumber + 1, { ex: 60 });

        await redis.zadd(queueKey, {
          score: getScore(token.priorityRank, token.tokenNumber),
          member: token._id.toString(),
        });

        await redis.expire(queueKey, 60 * 60 * 24);
      } catch (err) {
        console.log("Redis queue add failed (safe ignore):", err.message);
      }

      //  Recalculate queue only if booking is for today
      if (dayStart.getTime() === today.getTime()) {
        await recalculateQueuePositions(departmentId);
      }

      return token;
    } catch (err) {
      if (err.code === 11000 && attempt < MAX_RETRIES) continue;
      throw err;
    }
  }

  throw new Error("Token creation failed");
};

/* ===================== CALL NEXT TOKEN (ATOMIC) ===================== */
export const getNextToken = async (departmentId, doctorId) => {
  const today = getStartOfISTDay();

  const doctor = await User.findById(doctorId);
  if (!doctor || !doctor.isActive || !doctor.isAvailable) {
    throw new Error("Doctor is not available or on break");
  }

  if (String(doctor.departments) !== String(departmentId)) {
    throw new Error("Doctor not assigned to this department");
  }

  // doctor can handle only one active patient
  const activeToken = await Token.findOne({
    assignedDoctor: doctorId,
    status: "CALLED",
  });

  if (activeToken) {
    throw new Error("Doctor already has an active token");
  }

  const department = await Department.findById(departmentId);
  if (!department || !department.isOpen) {
    throw new Error("Department is closed");
  }

  const doctorName = await User.findById(doctorId)
    .select("name")
    .lean();

  const queueKey = getQueueKey(departmentId, today);

  let tokenId = null;
  let redisMiss = false;

  // Try Redis atomic pop
  try {
    const result = await redis.zpopmax(queueKey);

    if (result?.length) {
      tokenId = result[0].member;
    } else {
      redisMiss = true;
    }
  } catch (err) {
    console.log("Redis pop failed:", err.message);
    redisMiss = true;
  }

  // Fallback to MongoDB if Redis empty / evicted
  if (!tokenId) {
    const fallback = await Token.findOne({
      department: departmentId,
      appointmentDate: today,
      status: "WAITING",
    })
      .sort({ priorityRank: -1, tokenNumber: 1 })
      .select("_id");

    if (!fallback) {
      throw new Error("No waiting tokens available");
    }

    tokenId = fallback._id;
  }

  //Update token in DB
  const nextToken = await Token.findByIdAndUpdate(
    tokenId,
    {
      status: "CALLED",
      assignedDoctor: doctorId,
      calledAt: new Date(),
    },
    { new: true }
  ).populate("patient", "name");

  if (!nextToken) {
    throw new Error("Token not found after selection");
  }

  // If Redis key was missing (eviction/restart), rebuild queue
  if (redisMiss) {
    try {
      const waitingTokens = await Token.find({
        department: departmentId,
        appointmentDate: today,
        status: "WAITING",
      }).select("_id priorityRank tokenNumber");

      const pipeline = redis.pipeline();

      waitingTokens.forEach((t) => {
        pipeline.zadd(queueKey, {
          score: getScore(t.priorityRank, t.tokenNumber),
          member: t._id.toString(),
        });
      });

      pipeline.expire(queueKey, 60 * 60 * 24);
      await pipeline.exec();
    } catch (err) {
      console.log("Queue rebuild failed:", err.message);
    }
  }

  emit("TOKEN_CALLED", departmentId, {
    tokenId: nextToken._id,
    tokenNumber: nextToken.tokenNumber,
    doctorId,
    doctorName: doctorName?.name || "Doctor",
    patientName: nextToken.patient?.name,
  });

  await recalculateQueuePositions(departmentId);

  return nextToken;
};

/* ===================== COMPLETE TOKEN ===================== */
export const completeToken = async (tokenId) => {
  const today = getStartOfISTDay();

  //  Load token (single source of truth)
  const token = await Token.findById(tokenId);
  if (!token) throw new Error("Token not found");

  //  Ensure token is for today
  if (token.appointmentDate.getTime() !== today.getTime()) {
    throw new Error("Cannot complete token not scheduled for today");
  }

  //  Ensure correct state
  if (!isTransitionAllowed(token.status, "COMPLETED")) {
    throw new Error("Invalid token state transition");
  }

  //  HARD VALIDATION: visit must exist for THIS token & department
  const visitExists = await Visit.exists({
    token: token._id,                 // same token
    department: token.department,     // same department
  });

  if (!visitExists) {
    throw new Error(
      "Visit record for this token and department is required before completion"
    );
  }

  //  Complete token
  token.status = "COMPLETED";
  token.completedAt = new Date();
  await token.save();

  try {
    const queueKey = getQueueKey(token.department, token.appointmentDate);
    await redis.zrem(queueKey, token._id.toString());
  } catch (err) {
    console.log("Redis removal failed:", err.message);
  }

  emit("TOKEN_COMPLETED", token.department, { tokenId });
  await recalculateQueuePositions(token.department);

  return token;
};

export const completeCurrentTokenByDoctor = async (doctorId) => {
  const token = await Token.findOne({
    assignedDoctor: doctorId,
    status: "CALLED",
  });

  if (!token) {
    throw new Error("No active token to complete");
  }

  // reuse your existing logic
  return completeToken(token._id);
};

/* ===================== SKIP TOKEN ===================== */
export const skipToken = async (tokenId) => {
  const token = await Token.findById(tokenId);
  if (!token) throw new Error("Token not found");

  if (!isTransitionAllowed(token.status, "SKIPPED")) {
    throw new Error("Invalid token state transition");
  }

  token.status = "SKIPPED";
  await token.save();

  try {
    const queueKey = getQueueKey(token.department, token.appointmentDate);
    await redis.zrem(queueKey, token._id.toString());
  } catch (err) {
    console.log("Redis removal failed:", err.message);
  }

  emit("TOKEN_SKIPPED", token.department, { tokenId });
  await recalculateQueuePositions(token.department);
  return token;
};

export const skipCurrentTokenByDoctor = async (doctorId) => {
  const token = await Token.findOne({
    assignedDoctor: doctorId,
    status: "CALLED",
  });

  if (!token) {
    throw new Error("No active token to skip");
  }

  return skipToken(token._id);
};

/* ===================== MARK NO SHOW ===================== */
export const markNoShow = async (tokenId) => {
  const token = await Token.findById(tokenId);
  if (!token) throw new Error("Token not found");

  if (!isTransitionAllowed(token.status, "NO_SHOW")) {
    throw new Error("Invalid token state transition");
  }

  token.status = "NO_SHOW";
  await token.save();

  try {
    const queueKey = getQueueKey(token.department, token.appointmentDate);
    await redis.zrem(queueKey, token._id.toString());
  } catch (err) {
    console.log("Redis removal failed:", err.message);
  }

  emit("TOKEN_NO_SHOW", token.department, { tokenId });
  await recalculateQueuePositions(token.department);
  return token;
};

/* ===================== CANCEL TOKEN (WAITING ONLY) ===================== */
export const cancelToken = async (tokenId, userId) => {
  const token = await Token.findById(tokenId);
  if (!token) throw new Error("Token not found");

  if (token.patient.toString() !== userId.toString()) {
    throw new Error("Not authorized");
  }

  if (token.status === "CANCELLED") {
    return token; 
  }
  
  if (!isTransitionAllowed(token.status, "CANCELLED")) {
    throw new Error("Token cannot be cancelled now");
  }

  token.status = "CANCELLED";
  token.cancelledAt = new Date();
  await token.save();

  try {
    const queueKey = getQueueKey(token.department, token.appointmentDate);
    await redis.zrem(queueKey, token._id.toString());
  } catch (err) {
    console.log("Redis removal failed:", err.message);
  }
  // await recalculateQueuePositions(token.department);
  return token;
};

/* ===================== PATIENT ACTIVE TOKEN ===================== */
export const getPatientActiveToken = async (patientId) => {
  const dayStart = getStartOfISTDay(new Date());
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const token = await Token.findOne({
    patient: patientId,
    appointmentDate: { $gte: dayStart, $lt: dayEnd },
    status: { $in: ["WAITING", "CALLED"] },
  })
    .populate("department", "name slotDurationMinutes")
    .lean();

  if (!token || token.status !== "WAITING") {
    return token;
  }

  const queueKey = getQueueKey(token.department._id, dayStart);

  let patientsAhead = 0;
  let redisMiss = false;

  //  Try Redis rank lookup (instant)
  try {
    const rank = await redis.zrank(queueKey, token._id.toString());

    if (rank !== null) {
      patientsAhead = rank;
    } else {
      redisMiss = true;
    }
  } catch (err) {
    console.log("Redis rank failed:", err.message);
    redisMiss = true;
  }

  // Fallback to DB if Redis miss / eviction
  if (redisMiss) {
    const waitingTokens = await Token.find({
      department: token.department._id,
      appointmentDate: { $gte: dayStart, $lt: dayEnd },
      status: "WAITING",
    })
      .select("_id priorityRank tokenNumber")
      .sort({ priorityRank: -1, tokenNumber: 1 })
      .lean();

    patientsAhead = waitingTokens.findIndex(
      (t) => t._id.toString() === token._id.toString()
    );

    if (patientsAhead < 0) patientsAhead = 0;

    // rebuild Redis queue
    try {
      const pipeline = redis.pipeline();

      waitingTokens.forEach((t) => {
        pipeline.zadd(queueKey, {
          score: getScore(t.priorityRank, t.tokenNumber),
          member: t._id.toString(),
        });
      });

      pipeline.expire(queueKey, 60 * 60 * 24);
      await pipeline.exec();
    } catch (err) {
      console.log("Queue rebuild failed:", err.message);
    }
  }

  const slotDurationMinutes =
    token.department.slotDurationMinutes || 10;

  const waitingTime = calculateWaitingTime({
    patientsAhead,
    slotDurationMinutes,
  });

  return {
    ...token,
    waitingCount: patientsAhead,
    minMinutes: waitingTime.minMinutes,
    maxMinutes: waitingTime.maxMinutes,
  };
};

/* ===================== PATIENT Upcoming TOKEN ===================== */
export const getUpcomingTokensForPatient = async (patientId) => {
  const today = getStartOfISTDay();

  const tokens = await Token.find({
    patient: patientId,
    appointmentDate: { $gt: today },
    status: "WAITING",
  })
    .populate("department", "name")
    .sort({ appointmentDate: 1 })
    .lean();

  return tokens.map((token) => ({
    _id: token._id,
    tokenNumber: token.tokenNumber,
    appointmentDate: token.appointmentDate,
    departmentId: token.department._id,
    departmentName: token.department.name,
  }));
};

/* ===================== PATIENT TOKEN HISTORY===================== */
export const getPatientTokenHistory = async (patientId) => {
  const tokens = await Token.find({
    patient: patientId,
    status: { $in: ["COMPLETED", "CANCELLED", "SKIPPED"] },
  })
    .populate("department", "name")
    .sort({ appointmentDate: -1, createdAt: -1 })
    .lean();

  return tokens.map((token) => ({
    _id: token._id,
    tokenNumber: token.tokenNumber,
    status: token.status,
    appointmentDate: token.appointmentDate,
    departmentId: token.department._id,
    departmentName: token.department.name,
    priority: token.priority,
    completedAt: token.completedAt || null,
    cancelledAt: token.cancelledAt || null,
    skippedAt: token.skippedAt || null,
  }));
};

/* ===================== Expected Token Number ===================== */
export const getExpectedTokenNumber = async ({
  departmentId,
  appointmentDate,
}) => {
  const date = getStartOfISTDay(appointmentDate);

  const cacheKey = `expectedToken:${departmentId}:${date
    .toISOString()
    .slice(0, 10)}`;

  // Try Redis cache first
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return Number(cached);
    }
  } catch (err) {
    console.log("Redis read failed:", err.message);
  }

  // Fallback to MongoDB (source of truth)
  const lastToken = await Token.findOne({
    department: departmentId,
    appointmentDate: date,
  })
    .sort({ tokenNumber: -1 })
    .select("tokenNumber")
    .lean();

  const expectedTokenNumber = lastToken
    ? lastToken.tokenNumber + 1
    : 1;

  // Cache result for fast future lookup
  try {
    await redis.set(cacheKey, expectedTokenNumber, {
      ex: 60, // cache 1 minute
    });
  } catch (err) {
    console.log("Redis write failed:", err.message);
  }

  return expectedTokenNumber;
};

/* ===================== Recalculate Queue Positions ===================== */
export const recalculateQueuePositions = async (departmentId) => {
  const io = getIO();
  const today = getStartOfISTDay();
  const queueKey = getQueueKey(departmentId, today);

  const department = await Department.findById(departmentId)
    .select("slotDurationMinutes")
    .lean();

  const slotDurationMinutes = department?.slotDurationMinutes || 10;

  let tokens = [];
  let redisMiss = false;

  // Try Redis first
  try {
    const ids = await redis.zrevrange(queueKey, 0, -1);

    if (ids?.length) {
      tokens = await Token.find({ _id: { $in: ids } })
        .select("_id patient")
        .lean();

      // maintain Redis order
      tokens.sort(
        (a, b) => ids.indexOf(a._id.toString()) - ids.indexOf(b._id.toString())
      );
    } else {
      redisMiss = true;
    }
  } catch (err) {
    console.log("Redis read failed:", err.message);
    redisMiss = true;
  }

  // fallback to DB if Redis empty / evicted
  if (redisMiss) {
    tokens = await Token.find({
      department: departmentId,
      appointmentDate: today,
      status: "WAITING",
    })
      .select("_id patient priorityRank tokenNumber")
      .sort({ priorityRank: -1, tokenNumber: 1 })
      .lean();
  }

  if (!tokens.length) return;

  tokens.forEach((token, index) => {
    const waitingTime = calculateWaitingTime({
      patientsAhead: index,
      slotDurationMinutes,
    });

    io.to(`user:${token.patient.toString()}`).emit(
      "QUEUE_POSITION_UPDATE",
      {
        tokenId: token._id,
        ...waitingTime,
      }
    );
  });
};

/* ===================== FORMAT TIME ===================== */
const formatTime = (date) =>
  date.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }
);

/* ===================== DASHBOARD QUEUE SUMMARY ===================== */
export const getDoctorQueueSummary = async ({ departmentId, userId }) => {
  const today = getStartOfISTDay();
  const cacheKey = `dashboard:${departmentId}:${today.toISOString().slice(0,10)}`;

  //  Try cache first
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return cached;
    }
  } catch (err) {
    console.log("Redis read failed:", err.message);
  }

  const department = await Department.findById(departmentId).lean();
  if (!department) throw new Error("Department not found");

  const doctorProfile = await DoctorProfile.findOne({ user: userId }).lean();

  const opdStartTime = doctorProfile?.opdTimings?.[0]?.startTime || "09:00";
  const slotMinutes = department.slotDurationMinutes || 10;

  const [startHour, startMinute] = opdStartTime.split(":").map(Number);

  const [totalToday, completed, remaining, waitingTokens] = await Promise.all([
    Token.countDocuments({
      department: departmentId,
      appointmentDate: today,
    }),
    Token.countDocuments({
      department: departmentId,
      appointmentDate: today,
      status: "COMPLETED",
    }),
    Token.countDocuments({
      department: departmentId,
      appointmentDate: today,
      status: "WAITING",
    }),
    Token.find({
      department: departmentId,
      appointmentDate: today,
      status: "WAITING",
    })
      .sort({ priorityRank: -1, tokenNumber: 1 })
      .limit(5)
      .populate("patient", "name")
      .select("tokenNumber priority patient")
      .lean(),
  ]);

  const opdStart = new Date(today);
  opdStart.setUTCHours(startHour - 5, startMinute - 30, 0, 0);

  const nextWaiting = waitingTokens.map((t, index) => {
    const expected = new Date(opdStart);
    expected.setUTCMinutes(expected.getUTCMinutes() + index * slotMinutes);

    return {
      token: t.tokenNumber,
      name: t.patient?.name || "Unknown",
      priority: t.priority,
      time: formatTime(expected),
    };
  });

  const summary = {
    totalToday,
    completed,
    remaining,
    nextWaiting,
  };

  //Cache for 15 seconds
  try {
    await redis.set(cacheKey, summary, { ex: 15 });
  } catch (err) {
    console.log("Redis write failed:", err.message);
  }

  return summary;
};