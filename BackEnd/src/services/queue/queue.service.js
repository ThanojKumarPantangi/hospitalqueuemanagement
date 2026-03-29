import Token from "../../models/token.model.js";
import Department from "../../models/department.model.js";
import User from "../../models/user.model.js";
import Visit from "../../models/visit.model.js";
import { getIO } from "../../sockets/index.js";

import { calculateWaitingTime } from "../../utils/waitingTime.util.js";
import { getStartOfISTDay } from "../../utils/formatISTTime.util.js";
import DoctorProfile from "../../models/doctorProfile.model.js";

import redis from "../../config/redisClient.js";
import { getQueueKey, getScore } from "../../redis/queue.redis.js";

/* ===================== CONSTANTS ===================== */

const MAX_ADVANCE_DAYS = 5;

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
  EMERGENCY: 1,
  SENIOR: 2,
  NORMAL: 3,
};


const isTransitionAllowed = (from, to) =>
  TOKEN_STATES[from]?.includes(to);

/* ===================== SOCKET EMITTER ===================== */
const emitQueueEvent = (action, departmentId, payload = {}) => {
  const io = getIO();

  const finalPayload = {
    action,
    departmentId: departmentId.toString(),
    ...payload,
  };

  //  same event everywhere
  io.to(departmentId.toString()).emit("QUEUE_EVENT", finalPayload);

  // admin also gets SAME format
  io.to("admin-monitor").emit("QUEUE_EVENT", finalPayload);
};

/* ===================== CREATE TOKEN ===================== */
export const createToken = async ({
  patientId,
  departmentId,
  requestedPriority = "NORMAL",
  createdByRole,
  appointmentDate,
  consultationType,
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

  // IST normalization
  const today = getStartOfISTDay(new Date());
  const dayStart = getStartOfISTDay(appointmentDate);

  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  // Date validation
  const diffDays = (dayStart - today) / (1000 * 60 * 60 * 24);

  if (diffDays < 0) throw new Error("Cannot book past dates");
  if (diffDays > MAX_ADVANCE_DAYS) {
    throw new Error(`Booking allowed only ${MAX_ADVANCE_DAYS} days ahead`);
  }

  // One active token per patient per day
  const existing = await Token.findOne({
    patient: patientId,
    appointmentDate: { $gte: dayStart, $lt: dayEnd },
    status: { $in: ["WAITING", "CALLED"] },
  });

  if (existing) {
    throw new Error("Patient already has an active token for this day");
  }

  // Priority control
  let finalPriority = "NORMAL";
  if (
    createdByRole === "ADMIN" &&
    ["SENIOR", "EMERGENCY"].includes(requestedPriority)
  ) {
    finalPriority = requestedPriority;
  }

  const priorityRank = PRIORITY_ORDER[finalPriority];

  // Redis Keys
  const dateStr = dayStart.toISOString().slice(0, 10);
  const queueKey = `queue:${departmentId}:${dateStr}`;
  const counterKey = `tokenCounter:${departmentId}:${dateStr}`;

  // Expiry calculation
  const nextDayStart = new Date(dayStart);
  nextDayStart.setDate(nextDayStart.getDate() + 1);

  const ttlSeconds = Math.max(
    1,
    Math.floor((nextDayStart - new Date()) / 1000)
  );

  try {
    // Generate tokenNumber from Redis
    const nextTokenNumber = await redis.incr(counterKey);

    //  Create Mongo document
    const token = await Token.create({
      tokenNumber: nextTokenNumber,
      patient: patientId,
      department: departmentId,
      priority: finalPriority,
      priorityRank,
      appointmentDate: dayStart,
      consultationType,
      createdByRole,
    });

    try {
      // Add to Redis queue
      const score = priorityRank * 100000 + nextTokenNumber;

      await redis.zadd(queueKey, {
        score,
        member: token._id.toString(),
      });

      // Set expiry ONLY if not set 
      await redis.expire(queueKey, ttlSeconds, "NX");
      await redis.expire(counterKey, ttlSeconds, "NX");

    } catch (err) {
      console.log("Redis operation failed (non-blocking):", err.message);
    }

    // Optional: only for today's queue UI refresh
    if (dayStart.getTime() === today.getTime()) {
      await recalculateQueuePositions(departmentId);
    }

    return token;

  } catch (err) {
    throw new Error("Token creation failed: " + err.message);
  }
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

  // One active patient per doctor
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

  const queueKey = getQueueKey(departmentId, today);

  let tokenId = null;
  let redisMiss = false;

  // Pop from Redis (CORRECT ORDER)
  try {
    const result = await redis.zpopmin(queueKey);

    if (result?.length) {
      tokenId = result[0].member;
    } else {
      redisMiss = true;
    }
  } catch (err) {
    console.log("Redis pop failed:", err.message);
    redisMiss = true;
  }

  //  Mongo fallback
  if (!tokenId) {
    const fallback = await Token.findOne({
      department: departmentId,
      appointmentDate: today,
      status: "WAITING",
    })
      .sort({ priorityRank: 1, tokenNumber: 1 }) 
      .select("_id");

    if (!fallback) {
      throw new Error("No waiting tokens available");
    }

    tokenId = fallback._id;
  }

  //Update token
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

  // Rebuild queue if Redis failed
  if (redisMiss) {
    try {
      const waitingTokens = await Token.find({
        department: departmentId,
        appointmentDate: today,
        status: "WAITING",
      }).select("_id priorityRank tokenNumber");

      const pipeline = redis.pipeline();

      waitingTokens.forEach((t) => {
        const score = t.priorityRank * 100000 + t.tokenNumber;

        pipeline.zadd(queueKey, {
          score,
          member: t._id.toString(),
        });
      });

      // IST expiry
      const nextDayStart = new Date(today);
      nextDayStart.setDate(nextDayStart.getDate() + 1);

      const ttlSeconds = Math.max(
        1,
        Math.floor((nextDayStart - new Date()) / 1000)
      );

      pipeline.expire(queueKey, ttlSeconds);

      await pipeline.exec();
    } catch (err) {
      console.log("Queue rebuild failed:", err.message);
    }
  }

  //  Emit event
  emitQueueEvent("TOKEN_CALLED", departmentId, {
    tokenId: nextToken._id,
    tokenNumber: nextToken.tokenNumber,
    doctorId,
    doctorName: doctor.name,
    patientName: nextToken.patient?.name,
  });

  await recalculateQueuePositions(departmentId);

  return nextToken;
};

/* ===================== COMPLETE TOKEN ===================== */
export const completeToken = async (tokenId) => {
  const today = getStartOfISTDay();

  const token = await Token.findById(tokenId);
  if (!token) throw new Error("Token not found");

  // safer IST comparison
  const tokenDay = getStartOfISTDay(token.appointmentDate);

  if (tokenDay.getTime() !== today.getTime()) {
    throw new Error("Cannot complete token not scheduled for today");
  }

  if (!isTransitionAllowed(token.status, "COMPLETED")) {
    throw new Error("Invalid token state transition");
  }

  const visitExists = await Visit.exists({
    token: token._id,
    department: token.department,
  });

  if (!visitExists) {
    throw new Error(
      "Visit record for this token and department is required before completion"
    );
  }

  token.status = "COMPLETED";
  token.completedAt = new Date();
  await token.save();

  emitQueueEvent("TOKEN_COMPLETED", token.department.toString(), {
    tokenId: token._id,
    tokenNumber: token.tokenNumber,
  });

  await recalculateQueuePositions(token.department.toString());

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
  token.skippedAt = new Date();
  await token.save();

  emitQueueEvent("TOKEN_SKIPPED", token.department.toString(), {
    tokenId: token._id,
    tokenNumber: token.tokenNumber,
  });

  await recalculateQueuePositions(token.department.toString());

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
  token.noShowAt = new Date();
  await token.save();

  emitQueueEvent("TOKEN_NO_SHOW", token.department.toString(), {
    tokenId: token._id,
    tokenNumber: token.tokenNumber,
  });

  await recalculateQueuePositions(token.department.toString());

  return token;
};

/* ===================== CANCEL TOKEN ===================== */
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

  const wasWaiting = token.status === "WAITING";

  token.status = "CANCELLED";
  token.cancelledAt = new Date();
  await token.save();

  // Only remove if still in queue
  if (wasWaiting) {
    try {
      const queueKey = getQueueKey(token.department, token.appointmentDate);
      await redis.zrem(queueKey, token._id.toString());
    } catch (err) {
      console.log("Redis removal failed:", err.message);
    }
  }

  emitQueueEvent("TOKEN_CANCELLED", token.department.toString(), {
    tokenId: token._id,
    tokenNumber: token.tokenNumber,
  });

  // optional: keep it or skip (your choice)
  await recalculateQueuePositions(token.department.toString());

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

  if (!token) return null;

  // If not waiting → no queue position
  if (token.status !== "WAITING") {
    return {
      ...token,
      waitingCount: 0,
      position: 1,
      minMinutes: 0,
      maxMinutes: 0,
    };
  }

  const queueKey = getQueueKey(token.department._id, dayStart);

  let patientsAhead = 0;
  let redisMiss = false;

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

  // Mongo fallback (correct sorting)
  if (redisMiss) {
    const waitingTokens = await Token.find({
      department: token.department._id,
      appointmentDate: { $gte: dayStart, $lt: dayEnd },
      status: "WAITING",
    })
      .select("_id priorityRank tokenNumber")
      .sort({ priorityRank: 1, tokenNumber: 1 })
      .lean();

    patientsAhead = waitingTokens.findIndex(
      (t) => t._id.toString() === token._id.toString()
    );

    if (patientsAhead < 0) patientsAhead = 0;

    // Rebuild Redis queue with correct expiry
    try {
      const nextDayStart = new Date(dayStart);
      nextDayStart.setDate(nextDayStart.getDate() + 1);

      const ttlSeconds = Math.max(
        1,
        Math.floor((nextDayStart - new Date()) / 1000)
      );

      const pipeline = redis.pipeline();

      waitingTokens.forEach((t) => {
        pipeline.zadd(queueKey, {
          score: getScore(t.priorityRank, t.tokenNumber),
          member: t._id.toString(),
        });
      });

      pipeline.expire(queueKey, ttlSeconds);

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
    position: patientsAhead + 1, 
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
  const dateStr = date.toISOString().slice(0, 10);

  const counterKey = `tokenCounter:${departmentId}:${dateStr}`;

  //   Redis counter
  try {
    const current = await redis.get(counterKey);

    if (current !== null) {
      return Number(current) + 1;
    }
  } catch (err) {
    console.log("Redis read failed:", err.message);
  }

  //  Fallback to Mongo ONLY if Redis missing
  const lastToken = await Token.findOne({
    department: departmentId,
    appointmentDate: date,
  })
    .sort({ tokenNumber: -1 })
    .select("tokenNumber")
    .lean();

  return lastToken ? lastToken.tokenNumber + 1 : 1;
};

/* ===================== Recalculate Queue Positions ===================== */
export const recalculateQueuePositions = async (departmentId) => {
  const io = getIO();
  const today = getStartOfISTDay();
  const queueKey = getQueueKey(departmentId, today);

  try {
    // Lightweight global event 
    // io.to(`department:${departmentId}`).emit("QUEUE_UPDATED", {
    //   departmentId,
    //   timestamp: Date.now(),
    // });

    const department = await Department.findById(departmentId)
      .select("slotDurationMinutes")
      .lean();

    const slotDurationMinutes = department?.slotDurationMinutes || 10;

    let tokens = [];
    let redisMiss = false;

    //  Correct Redis order
    try {
      const ids = await redis.zrange(queueKey, 0, -1);

      if (ids?.length) {
        const limitedIds = ids.slice(0, 15); // limit heavy updates

        tokens = await Token.find({ _id: { $in: limitedIds } })
          .select("_id patient")
          .lean();

        tokens.sort(
          (a, b) =>
            limitedIds.indexOf(a._id.toString()) -
            limitedIds.indexOf(b._id.toString())
        );
      } else {
        redisMiss = true;
      }
    } catch (err) {
      console.log("Redis read failed:", err.message);
      redisMiss = true;
    }

    // Mongo fallback 
    if (redisMiss) {
      tokens = await Token.find({
        department: departmentId,
        appointmentDate: today,
        status: "WAITING",
      })
        .select("_id patient priorityRank tokenNumber")
        .sort({ priorityRank: 1, tokenNumber: 1 }) 
        .limit(15)
        .lean();
    }

    if (!tokens.length) return;

    //  Emit only top users 
    tokens.forEach((token, index) => {
      const waitingTime = calculateWaitingTime({
        patientsAhead: index,
        slotDurationMinutes,
      });

      emitQueueEvent("QUEUE_POSITION_UPDATE", departmentId, {
        tokenId: token._id,
        ...waitingTime,
      });

      // io.to(`user:${token.patient.toString()}`).emit(
      //   "QUEUE_POSITION_UPDATE",
      //   {
      //     tokenId: token._id,
      //     ...waitingTime,
      //   }
      // );
    });

  } catch (err) {
    console.log("Queue recalculation failed:", err.message);
  }
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
  const dateStr = today.toISOString().slice(0, 10);
  const cacheKey = `dashboard:${departmentId}:${dateStr}`;

  // Try cache first
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (err) {
        await redis.del(cacheKey);
      }
    }
  } catch (err) {
    console.log("Redis read failed:", err.message);
  }

  const department = await Department.findById(departmentId).lean();
  if (!department) throw new Error("Department not found");

  const doctorProfile = await DoctorProfile.findOne({ user: userId }).lean();

  const opdStartTime =
    doctorProfile?.opdTimings?.[0]?.startTime || "09:00";

  const slotMinutes = department.slotDurationMinutes || 10;

  const [startHour, startMinute] = opdStartTime.split(":").map(Number);

  // Parallel DB queries
  const [totalToday, completed, waitingCount] = await Promise.all([
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
  ]);

  //  Get next 5 tokens from Redis (CORRECT ORDER)
  const queueKey = getQueueKey(departmentId, today);

  let nextTokens = [];

  try {
    const ids = await redis.zrange(queueKey, 0, 4);

    if (ids?.length) {
      const tokens = await Token.find({ _id: { $in: ids } })
        .select("tokenNumber priority patient")
        .populate("patient", "name")
        .lean();

      // maintain Redis order
      tokens.sort(
        (a, b) =>
          ids.indexOf(a._id.toString()) -
          ids.indexOf(b._id.toString())
      );

      nextTokens = tokens;
    }
  } catch (err) {
    console.log("Redis queue fetch failed:", err.message);
  }

  //  
  if (!nextTokens.length) {
    nextTokens = await Token.find({
      department: departmentId,
      appointmentDate: today,
      status: "WAITING",
    })
      .sort({ priorityRank: 1, tokenNumber: 1 })
      .limit(5)
      .populate("patient", "name")
      .select("tokenNumber priority patient")
      .lean();
  }

  // Calculate expected times
  const opdStart = new Date(today);
  opdStart.setUTCHours(startHour - 5, startMinute - 30, 0, 0);

  const nextWaiting = nextTokens.map((t, index) => {
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
    remaining: waitingCount,
    nextWaiting,
  };

  // Cache 
  try {
    await redis.set(cacheKey, JSON.stringify(summary), { ex: 15 });
  } catch (err) {
    console.log("Redis write failed:", err.message);
  }

  return summary;
};