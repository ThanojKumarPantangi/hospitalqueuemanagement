import mongoose from "mongoose";
import Message from "../models/message.model.js";
import { getIO, getOnlineUserSockets } from "../sockets/index.js";
import User from "../models/user.model.js";
import Token from "../models/token.model.js";

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

const date = new Date();
const start = getStartOfISTDay(date);
const end = new Date(start);
end.setDate(end.getDate() + 1);


/* ============================
   SEND DIRECT MESSAGE
============================ */
export const sendMessageService = async ({
  toUserId,
  fromUserId,
  title,
  content,
  type = "GENERAL",
  metadata = {},
}) => {
  const message = await Message.create({
    toUser: toUserId,
    fromUser: fromUserId,
    senderRole: "ADMIN",
    title,
    content,
    type,
    metadata,
  });

  // MULTI-TAB SAFE SOCKET EMIT
  const socketIds = getOnlineUserSockets(toUserId);

  if (socketIds.size > 0) {
    for (const socketId of socketIds) {
      getIO().to(socketId).emit("messages:new", message.toObject());
    }

    //  MARK AS DELIVERED (at least one socket received it)
    await Message.updateOne(
      { _id: message._id },
      { $set: { deliveredAt: new Date() } }
    );
  }

  return message;
};

/* ============================
   SEND DEPARTMENT ANNOUNCEMENT
============================ */
export const sendDepartmentAnnouncementService = async ({
  departmentId,
  fromUserId,
  title,
  content,
}) => {
  const doctors = await User.find({
    departments: departmentId,
    isActive: true,
  }).select("_id");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const patientTokens = await Token.find({
    department: departmentId,
    appointmentDate: today,
    status: { $in: ["WAITING", "CALLED"] },
  }).select("patient");

  const userIds = new Set();

  doctors.forEach(d => userIds.add(d._id.toString()));
  patientTokens.forEach(t => t.patient && userIds.add(t.patient.toString()));

  if (!userIds.size) return [];

  const messages = await Message.insertMany(
    [...userIds].map(userId => ({
      toUser: userId,
      fromUser: fromUserId,
      senderRole: "ADMIN",
      type: "ANNOUNCEMENT",
      title,
      content,
      metadata: { departmentId },
    }))
  );

  //  EMIT TO ALL ONLINE SOCKETS PER USER
  for (const msg of messages) {
    const socketIds = getOnlineUserSockets(msg.toUser.toString());

    if (socketIds.size > 0) {
      for (const socketId of socketIds) {
        getIO().to(socketId).emit("messages:new", msg.toObject());
      }

      await Message.updateOne(
        { _id: msg._id },
        { $set: { deliveredAt: new Date() } }
      );
    }
  }

  return messages;
};

/* ============================
   SEND GLOBAL MESSAGE
   (ALL WAITING PATIENTS TODAY - IST SAFE)
============================ */
export const sendGlobalWaitingPatientsMessageService = async ({
  fromUserId,
  title,
  content,
}) => {
  const { start, end } = getISTDayRange();

  const tokens = await Token.find(
    {
      appointmentDate: {
        $gte: start,
        $lt: end,
      },
      status: "WAITING",
    },
    { patient: 1, _id: 0 }
  ).lean();

  const userIds = new Set();
  for (const t of tokens) {
    if (t.patient) userIds.add(t.patient.toString());
  }

  if (userIds.size === 0) return [];

  const messages = await Message.insertMany(
    [...userIds].map(userId => ({
      toUser: userId,
      fromUser: fromUserId,
      senderRole: "ADMIN",
      type: "ANNOUNCEMENT",
      title,
      content,
      metadata: {
        scope: "GLOBAL_WAITING_PATIENTS",
        dateRange: { start, end },
      },
    }))
  );

  for (const msg of messages) {
    const socketIds = getOnlineUserSockets(msg.toUser.toString());

    if (socketIds.size > 0) {
      for (const socketId of socketIds) {
        getIO().to(socketId).emit("messages:new", msg.toObject());
      }

      await Message.updateOne(
        { _id: msg._id },
        { $set: { deliveredAt: new Date() } }
      );
    }
  }

  return messages;
};

/* ============================
   SEND GLOBAL MESSAGE
   (ALL ACTIVE & AVAILABLE DOCTORS)
============================ */
export const sendGlobalActiveDoctorsMessageService = async ({
  fromUserId,
  title,
  content,
}) => {
  //  Find all eligible doctors
  const doctors = await User.find({
    role: "DOCTOR",
    isActive: true,
    isAvailable: true,
  }).select("_id");

  if (!doctors.length) return [];

  //  Create messages (one per doctor)
  const messages = await Message.insertMany(
    doctors.map(doc => ({
      toUser: doc._id,
      fromUser: fromUserId,
      senderRole: "ADMIN",
      type: "ANNOUNCEMENT",
      title,
      content,
      metadata: {
        scope: "GLOBAL_ACTIVE_DOCTORS",
      },
    }))
  );

  //  Emit to all online sockets (multi-tab safe)
  for (const msg of messages) {
    const socketIds = getOnlineUserSockets(msg.toUser.toString());

    if (socketIds.size > 0) {
      for (const socketId of socketIds) {
        getIO().to(socketId).emit("messages:new", msg.toObject());
      }

      //  Mark delivered if at least one socket received it
      await Message.updateOne(
        { _id: msg._id },
        { $set: { deliveredAt: new Date() } }
      );
    }
  }

  return messages;
};

/* ============================
   SEND MESSAGE TO ADMIN
============================ */
export const sendMessageToAdminService = async ({
  fromUserId,
  fromRole,
  title,
  content,
  category = "GENERAL",
}) => {
  if (!["DOCTOR", "PATIENT"].includes(fromRole)) {
    throw new Error("Only doctors or patients can message admin");
  }

  const admin = await User.findOne({
    role: "ADMIN",
    isActive: true,
  }).select("_id");

  if (!admin) {
    throw new Error("No active admin available");
  }

  //  ALWAYS create a new thread (new ticket)
  const threadId = new mongoose.Types.ObjectId();

  const message = await Message.create({
    threadId,
    toUser: admin._id,
    fromUser: fromUserId,
    senderRole: fromRole,
    category,
    type: "GENERAL",
    title,
    content,
    metadata: {
      scope: "USER_TO_ADMIN",
      ticketStatus: "OPEN", // optional but recommended
    },
  });

  getIO()
  .to(`user:${admin._id}`)
  .emit("messages:new", message.toObject());

  await Message.updateOne(
    { _id: message._id },
    { $set: { deliveredAt: new Date() } }
  );

  return message;
};

/* ============================
   USER → THREAD LIST
============================ */
export const getUserThreadsService = async ({ userId }) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const threads = await Message.aggregate([
    {
      $match: {
        threadId: { $exists: true, $ne: null },
        $or: [
          { fromUser: userObjectId },
          { toUser: userObjectId },
        ],
      },
    },
    {
      //  FIX: correct field
      $sort: { createdAt: -1 },
    },
    {
      $group: {
        _id: "$threadId",
        lastMessage: { $first: "$content" },
        lastAt: { $first: "$createdAt" },
        category: { $first: "$category" },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$toUser", userObjectId] },
                  { $eq: ["$readAt", null] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        threadId: "$_id",
        lastMessage: 1,
        lastAt: 1,
        category: 1,
        unread: { $gt: ["$unreadCount", 0] },
      },
    },
    {
      $sort: { lastAt: -1 },
    },
  ]);

  return threads;
};

/* ============================
   USER → THREAD MESSAGES
============================ */
export const getUserThreadMessagesService = async ({
  userId,
  threadId,
}) => {
  if (!threadId) {
    throw new Error("threadId is required");
  }

  const belongs = await Message.exists({
    threadId,
    $or: [{ fromUser: userId }, { toUser: userId }],
  });

  if (!belongs) {
    throw new Error("Unauthorized access to thread");
  }

  const messages = await Message.find({ threadId })
    .sort({ createdAt: 1 })
    .populate("fromUser", "name role")
    .populate("toUser", "name role")
    .lean();

  await Message.updateMany(
    {
      threadId,
      toUser: userId,
      readAt: null,
    },
    { $set: { readAt: new Date() } }
  );

  return messages;
};

/* ============================
   REPLY TO THREAD
============================ */
export const replyToThreadService = async ({
  threadId,
  fromUserId,
  title,
  content,
  category,
}) => {
  if (!threadId || !content) {
    throw new Error("threadId and content are required");
  }

  /* ============================
     VERIFY SENDER
  ============================ */
  const sender = await User.findById(fromUserId).select("role");

  if (!sender || !["ADMIN", "DOCTOR", "PATIENT"].includes(sender.role)) {
    throw new Error("Unauthorized sender");
  }

  /* ============================
     FETCH THREAD ROOT (AUTHORITATIVE)
  ============================ */
  const rootMessage = await Message.findOne({ threadId })
    .sort({ createdAt: 1 })
    .select("metadata category fromUser toUser");

  if (!rootMessage) {
    throw new Error("Thread not found");
  }

  /* ============================
      BLOCK CLOSED TICKETS
  ============================ */
  if (rootMessage.metadata?.ticketStatus === "CLOSED") {
    throw new Error("Ticket is closed");
  }

  /* ============================
     VERIFY THREAD PARTICIPATION
  ============================ */
  const isParticipant =
    rootMessage.fromUser.toString() === fromUserId ||
    rootMessage.toUser?.toString() === fromUserId ||
    sender.role === "ADMIN"; // admin override

  if (!isParticipant) {
    throw new Error("User does not belong to this thread");
  }

  /* ============================
     DETERMINE RECIPIENT
  ============================ */
  const lastMessage = await Message.findOne({ threadId })
    .sort({ createdAt: -1 })
    .select("fromUser toUser");

  const recipientId =
    lastMessage.fromUser.toString() === fromUserId
      ? lastMessage.toUser
      : lastMessage.fromUser;

  /* ============================
     CREATE REPLY
  ============================ */
  const reply = await Message.create({
    threadId,
    toUser: recipientId,
    fromUser: fromUserId,
    senderRole: sender.role,
    category: category || rootMessage.category,
    type: "GENERAL",
    title,
    content,
    metadata: {
      scope: "THREAD_REPLY",
    },
  });

  /* ============================
     SOCKET DELIVERY
  ============================ */
  getIO()
    .to(`user:${recipientId}`)
    .emit("messages:new", reply.toObject());

  await Message.updateOne(
    { _id: reply._id },
    { $set: { deliveredAt: new Date() } }
  );

  return reply;
};

/* ============================
   ADMIN INBOX – THREAD LIST
============================ */
export const getAdminThreadsService = async () => {
  const threads = await Message.aggregate([
    {
      $match: {
        threadId: { $ne: null },
      },
    },

    // newest messages first (important for $first)
    {
      $sort: { createdAt: -1 },
    },

    {
      $group: {
        _id: "$threadId",

        // last message preview
        lastMessage: { $first: "$content" },
        lastAt: { $first: "$createdAt" },
        category: { $first: "$category" },

        fromUser: { $first: "$fromUser" },

        // unread count
        unreadCount: {
          $sum: {
            $cond: [{ $eq: ["$readAt", null] }, 1, 0],
          },
        },

        // 🔑 collect ALL metadata for this thread
        allMetadata: { $push: "$metadata" },
      },
    },

    // derive ticket status from metadata array
    {
      $addFields: {
        ticketClosedMeta: {
          $first: {
            $filter: {
              input: "$allMetadata",
              as: "m",
              cond: { $eq: ["$$m.ticketStatus", "CLOSED"] },
            },
          },
        },
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "fromUser",
        foreignField: "_id",
        as: "user",
      },
    },

    { $unwind: "$user" },

    {
      $project: {
        threadId: "$_id",
        lastMessage: 1,
        lastAt: 1,
        category: 1,

        unread: { $gt: ["$unreadCount", 0] },

        // ✅ FINAL ticket state emitted to frontend
        ticketStatus: {
          $cond: [
            { $ifNull: ["$ticketClosedMeta", false] },
            "CLOSED",
            "OPEN",
          ],
        },

        closedAt: "$ticketClosedMeta.closedAt",

        user: {
          _id: "$user._id",
          name: "$user.name",
          role: "$user.role",
        },
      },
    },

    {
      $sort: { lastAt: -1 },
    },
  ]);

  return threads;
};

/* ============================
   GET THREAD MESSAGES
============================ */
export const getThreadMessagesService = async ({ threadId, adminId }) => {
  if (!threadId) {
    throw new Error("threadId is required");
  }

  const messages = await Message.find({ threadId })
    .sort({ createdAt: 1 })
    .populate("fromUser", "name role")
    .populate("toUser", "name role")
    .lean();

  //  Mark admin-side messages as read
  await Message.updateMany(
    {
      threadId,
      toUser: adminId,
      readAt: null,
    },
    { $set: { readAt: new Date() } }
  );

  return messages;
};

/* ============================
   CLOSE TICKET (ADMIN ONLY)
============================ */
export const closeTicketService = async ({
  threadId,
  adminId,
}) => {
  if (!threadId) {
    throw new Error("threadId is required");
  }

  /* ----------------------------
     VERIFY ADMIN
  ---------------------------- */
  const admin = await User.findById(adminId).select("role");
  if (!admin || admin.role !== "ADMIN") {
    throw new Error("Only admin can close tickets");
  }

  /* ----------------------------
     FIND ROOT MESSAGE
  ---------------------------- */
  const rootMessage = await Message.findOne({ threadId })
    .sort({ createdAt: 1 });

  if (!rootMessage) {
    throw new Error("Ticket not found");
  }

  if (rootMessage.metadata?.ticketStatus === "CLOSED") {
    throw new Error("Ticket already closed");
  }

  /* ----------------------------
     CLOSE TICKET
  ---------------------------- */
  rootMessage.metadata = {
    ...rootMessage.metadata,
    ticketStatus: "CLOSED",
    closedAt: new Date(),
    closedBy: adminId,
  };

  await rootMessage.save();

  /* ----------------------------
     SOCKET NOTIFY USER
  ---------------------------- */
  const userId = rootMessage.fromUser.toString();
  const socketIds = getOnlineUserSockets(userId);

  if (socketIds.size > 0) {
    for (const socketId of socketIds) {
      getIO().to(socketId).emit("messages:new", {
        threadId,
        closedAt: rootMessage.metadata.closedAt,
      });
    }
  }

  return {
    success: true,
    threadId,
    status: "CLOSED",
  };
};

/* ============================
   PREVIEW RECIPIENTS
============================ */
export const previewRecipientsService = async ({ mode, departmentId }) => {
  let users = [];

  //  IST-safe day range
  const date = new Date();
  const start = getStartOfISTDay(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  /* ============================
     DEPARTMENT PREVIEW (FIXED)
  ============================ */
  if (mode === "department") {
    if (!departmentId) {
      throw new Error("departmentId is required for department preview");
    }

    //  Doctors assigned to department
    const doctors = await User.find({
      role: "DOCTOR",
      departments: departmentId,
      isActive: true,
    }).select("_id name role");

    //  Patients via today's tokens (IST-safe)
    const tokens = await Token.find({
      department: departmentId,
      appointmentDate: {
        $gte: start,
        $lt: end,
      },
      status: { $in: ["WAITING", "CALLED"] },
    })
      .populate("patient", "name role")
      .lean();

    const patients = tokens
      .map(t => t.patient)
      .filter(Boolean);

    users = [...doctors, ...patients];
  }

  /* ============================
     WAITING PATIENTS (TODAY - IST)
  ============================ */
  if (mode === "waitingPatients") {
    const tokens = await Token.find({
      appointmentDate: {
        $gte: start,
        $lt: end,
      },
      status: "WAITING",
    })
      .populate("patient", "name role")
      .lean();

    users = tokens
      .map(t => t.patient)
      .filter(Boolean);
  }

  /* ============================
     ACTIVE DOCTORS
  ============================ */
  if (mode === "activeDoctors") {
    users = await User.find({
      role: "DOCTOR",
      isActive: true,
      isAvailable: true,
    }).select("_id name role");
  }

  /* ============================
     DEDUPLICATE USERS (FINAL)
  ============================ */
  const uniqueMap = new Map();
  for (const u of users) {
    uniqueMap.set(u._id.toString(), u);
  }

  return {
    count: uniqueMap.size,
    recipients: Array.from(uniqueMap.values()),
  };
};

/* ============================
   GET MESSAGES (PAGINATED)
============================ */
export const getMessagesService = async ({
  userId,
  page,
  limit,
}) => {
  const skip = (page - 1) * limit;

  const filter = {
    toUser: userId,
    threadId: { $exists: false }, 
  };

  const [messages, total] = await Promise.all([
    Message.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Message.countDocuments(filter),
  ]);

  return {
    messages,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/* ============================
   MARK MESSAGES AS READ
============================ */
export const markMessagesReadService = async ({
  userId,
  messageIds,
}) => {
  await Message.updateMany(
    {
      _id: { $in: messageIds },
      toUser: userId,
      readAt: null,
    },
    {
      $set: { readAt: new Date() },
    }
  );
};