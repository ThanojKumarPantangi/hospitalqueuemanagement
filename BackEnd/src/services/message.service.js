import Message from "../models/message.model.js";
import { getIO, getOnlineUserSocket } from "../sockets/index.js";


export const sendMessageService = async ({
  toUserId,
  fromUserId,
  title,
  content,
  type = "GENERAL",
  metadata = {},
}) => {
  // 1️⃣ Persist message FIRST
  const message = await Message.create({
    toUser: toUserId,
    fromUser: fromUserId,
    senderRole: "ADMIN",
    title,
    content,
    type,
    metadata,
  });

  // 2️⃣ Try realtime delivery
  const socketId = getOnlineUserSocket(toUserId);

  if (socketId) {
    getIO()
      .to(`user:${toUserId}`)
      .emit("messages:new", message);
  }

  return message;
};

export const sendDepartmentAnnouncementService = async ({
  departmentId,
  fromUserId,
  title,
  content,
}) => {
  // 1️⃣ Find users in that department
  const users = await User.find({
    department: departmentId,
    isActive: true,
  }).select("_id");

  if (!users.length) return;

  // 2️⃣ Create message per user (DB truth)
  const messages = users.map(user => ({
    toUser: user._id,
    fromUser: fromUserId,
    senderRole: "ADMIN",
    type: "ANNOUNCEMENT",
    title,
    content,
    metadata: { departmentId },
  }));

  await Message.insertMany(messages);

  // 3️⃣ Realtime delivery to department room
  getIO()
    .to(departmentId)
    .emit("messages:new", {
      type: "ANNOUNCEMENT",
      title,
      content,
      metadata: { departmentId },
      createdAt: new Date(),
    });
};


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