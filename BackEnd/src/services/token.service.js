import Token from "../models/token.model.js";
import Department from "../models/department.model.js";
import User from "../models/user.model.js";
import { getIO } from "../sockets/index.js";

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

/* ===================== UTILS ===================== */

const getStartOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
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

//   if (!department.doctors || department.doctors.length === 0) {
//   throw new Error("No doctors available in this department");
// }

  const today = getStartOfDay();
  const selectedDate = getStartOfDay(appointmentDate);

  const diffDays =
    (selectedDate - today) / (1000 * 60 * 60 * 24);

  if (diffDays < 0) throw new Error("Cannot book past dates");
  if (diffDays > MAX_ADVANCE_DAYS) {
    throw new Error(`Booking allowed only ${MAX_ADVANCE_DAYS} days ahead`);
  }

  // 🔒 one active token per patient per day
  const existing = await Token.findOne({
    patient: patientId,
    appointmentDate: selectedDate,
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

  // 🔁 safe tokenNumber generation with retry
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const lastToken = await Token.findOne({
        department: departmentId,
        appointmentDate: selectedDate,
      })
        .sort({ tokenNumber: -1 })
        .lean();

      const nextTokenNumber = lastToken
        ? lastToken.tokenNumber + 1
        : 1;

      const token = await Token.create({
        tokenNumber: nextTokenNumber,
        patient: patientId,
        department: departmentId,
        priority: finalPriority,
        appointmentDate: selectedDate,
      });

      if (selectedDate.getTime() === today.getTime()) {
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
  const today = getStartOfDay();

  const doctor = await User.findById(doctorId);
  if (!doctor || !doctor.isActive || !doctor.isAvailable) {
    throw new Error("Doctor is not available");
  }

 
  if (String(doctor.departments) !== String(departmentId)) {
    throw new Error("Doctor not assigned to this department");
  }

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

  // 5️⃣ Atomic pick + update next token
  const nextToken = await Token.findOneAndUpdate(
    {
      department: departmentId,
      appointmentDate: today,
      status: "WAITING",
    },
    {
      status: "CALLED",
      assignedDoctor: doctorId,
      calledAt: new Date(),
    },
    {
      sort: { priority: -1, tokenNumber: 1 }, 
      new: true,
    }
  );

  if (!nextToken) {
    throw new Error("No waiting tokens available");
  }

  emit("TOKEN_CALLED", departmentId, {
    tokenId: nextToken._id,
    tokenNumber: nextToken.tokenNumber,
    doctorId,
  });
  await recalculateQueuePositions(departmentId);

  return nextToken;
};

/* ===================== COMPLETE TOKEN ===================== */

export const completeToken = async (tokenId) => {
  const token = await Token.findById(tokenId);
  if (!token) throw new Error("Token not found");

  if (!isTransitionAllowed(token.status, "COMPLETED")) {
    throw new Error("Invalid token state transition");
  }

  token.status = "COMPLETED";
  token.completedAt = new Date();
  await token.save();

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
  await recalculateQueuePositions(token.department);
  return token;
};

/* ===================== PATIENT ACTIVE TOKEN ===================== */
export const getPatientActiveToken = async (patientId) => {
  const today = getStartOfDay();

  const token = await Token.findOne({
    patient: patientId,
    appointmentDate: today,
    status: { $in: ["WAITING", "CALLED"] },
  })
    .populate("department", "name")
    .lean();

  if (!token || token.status !== "WAITING") {
    return token;
  }

  // Calculate waitingCount once
  const waitingTokens = await Token.find({
    department: token.department._id,
    appointmentDate: today,
    status: "WAITING",
  })
    .select("_id priority tokenNumber")
    .lean();

  waitingTokens.sort((a, b) => {
    const pDiff =
      PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
    if (pDiff !== 0) return pDiff;
    return a.tokenNumber - b.tokenNumber;
  });

  const index = waitingTokens.findIndex(
    t => t._id.toString() === token._id.toString()
  );

  return {
    ...token,
    waitingCount: index >= 0 ? index : 0,
  };
};


/* ===================== PATIENT Upcoming TOKEN ===================== */
export const getUpcomingTokensForPatient = async (patientId) => {
  const today = getStartOfDay();

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
  // Normalize date (start of day)
  const date = new Date(appointmentDate);
  date.setHours(0, 0, 0, 0);

  // Find the highest token number for that department & date
  const lastToken = await Token.findOne({
    department: departmentId,
    appointmentDate: date,
  })
    .sort({ tokenNumber: -1 })
    .select("tokenNumber")
    .lean();

  // If no token exists yet, next token will be 1
  const expectedTokenNumber = lastToken
    ? lastToken.tokenNumber + 1
    : 1;

  return expectedTokenNumber;
};

const PRIORITY_ORDER = {
  EMERGENCY: 3,
  SENIOR: 2,
  NORMAL: 1,
};

/* ===================== Recalculate Queue Positions ===================== */
export const recalculateQueuePositions = async (departmentId) => {
  const io = getIO();
  const today = getStartOfDay();

  // 1️⃣ Fetch all waiting tokens for today + department
  const tokens = await Token.find({
    department: departmentId,
    appointmentDate: today,
    status: "WAITING",
  })
    .select("_id patient priority tokenNumber")
    .lean();

  if (!tokens.length) return;

  // 2️⃣ Sort by priority DESC, tokenNumber ASC
  tokens.sort((a, b) => {
    const pDiff =
      PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
    if (pDiff !== 0) return pDiff;
    return a.tokenNumber - b.tokenNumber;
  });

  // 3️⃣ Emit waitingCount to each user privately
  tokens.forEach((token, index) => {
    io.to(`user:${token.patient.toString()}`).emit(
      "QUEUE_POSITION_UPDATE",
      {
        tokenId: token._id,
        waitingCount: index,
      }
    );
  });
};