import Message from "../models/message.model.js";
import { getIO, getOnlineUserSockets } from "../sockets/index.js";
import User from "../models/user.model.js";
import Token from "../models/token.model.js";

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

  // 🔁 MULTI-TAB SAFE SOCKET EMIT
  const socketIds = getOnlineUserSockets(toUserId);

  if (socketIds.size > 0) {
    for (const socketId of socketIds) {
      getIO().to(socketId).emit("messages:new", message.toObject());
    }

    // ✅ MARK AS DELIVERED (at least one socket received it)
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

  // 🔁 EMIT TO ALL ONLINE SOCKETS PER USER
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
   GET MESSAGES (PAGINATED)
============================ */
export const getMessagesService = async ({
  userId,
  page,
  limit,
}) => {
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    Message.find({ toUser: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Message.countDocuments({ toUser: userId }),
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