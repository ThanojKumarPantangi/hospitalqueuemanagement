import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Message from "../models/message.model.js";
import Session from "../models/session.model.js";
import {
  addSocketToSession,
  removeSocketFromSession,
} from "./sessionSocketMap.js";


let io;

/* ============================
   ONLINE USER TRACKING
============================ */
const onlineUsers = new Map(); // userId -> socketId

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  /* ============================
     AUTH MIDDLEWARE
  ============================ */
  // io.use((socket, next) => {
  //   try {
  //     const token =
  //       socket.handshake.auth?.token ||
  //       socket.handshake.headers?.authorization?.split(" ")[1];

  //     if (!token) return next(new Error("Authentication error"));

  //     const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

  //     socket.user = {
  //       id: decoded.id,
  //       role: decoded.role,
  //     };

  //     // Track current department room
  //     socket.currentDepartment = null;

  //     next();
  //   } catch (err) {
  //     next(new Error("Invalid token"));
  //   }
  // });

  io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) return next(new Error("Authentication error"));

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // 🔐 SESSION VALIDATION (NEW)
    const session = await Session.findById(decoded.sessionId);
    if (!session || !session.isActive) {
      return next(new Error("Session expired"));
    }

    socket.user = {
      id: decoded.id,
      role: decoded.role,
      sessionId: decoded.sessionId,
    };

    socket.currentDepartment = null;

    next();
  } catch {
    next(new Error("Invalid token"));
  }
  });


  /* ============================
     CONNECTION HANDLER
  ============================ */
  io.on("connection", async (socket) => {

    const { sessionId } = socket.user;
    addSocketToSession(sessionId, socket.id);


    const userId = socket.user.id;

    console.log(`Client connected ${socket.id} (user ${userId})`);

    /* ============================
       TRACK ONLINE USER
    ============================ */
    onlineUsers.set(userId, socket.id);

    /* ============================
       USER PRIVATE ROOM
    ============================ */
    socket.join(`user:${userId}`);

    /* ============================
       REPLAY UNREAD MESSAGES
    ============================ */
    try {
      const unreadMessages = await Message.find({
        toUser: userId,
        readAt: null,
      }).sort({ createdAt: 1 });

      if (unreadMessages.length > 0) {
        socket.emit("messages:missed", unreadMessages);
      }
    } catch (err) {
      console.error("Failed to replay unread messages:", err.message);
    }

    /* ============================
       DEPARTMENT ROOM HANDLERS
    ============================ */
    socket.on("join-department", (departmentId) => {
      if (!departmentId) return;

      // Leave previous department if exists
      if (
        socket.currentDepartment &&
        socket.currentDepartment !== departmentId
      ) {
        socket.leave(socket.currentDepartment);
        console.log(
          `Socket ${socket.id} left department ${socket.currentDepartment}`
        );
      }

      socket.join(departmentId);
      socket.currentDepartment = departmentId;

      console.log(
        `Socket ${socket.id} joined department ${departmentId}`
      );
    });

    socket.on("leave-department", (departmentId) => {
      if (!departmentId) return;

      socket.leave(departmentId);

      if (socket.currentDepartment === departmentId) {
        socket.currentDepartment = null;
      }

      console.log(
        `Socket ${socket.id} left department ${departmentId}`
      );
    });

    /* ============================
       MESSAGE READ ACK
    ============================ */
    socket.on("messages:read", async (messageIds = []) => {
      if (!Array.isArray(messageIds) || messageIds.length === 0) return;

      try {
        await Message.updateMany(
          {
            _id: { $in: messageIds },
            toUser: userId,
            readAt: null,
          },
          { $set: { readAt: new Date() } }
        );
      } catch (err) {
        console.error("Failed to mark messages as read:", err.message);
      }
    });

    /* ============================
       DISCONNECT CLEANUP
    ============================ */
    // socket.on("disconnect", () => {
    //   onlineUsers.delete(userId);

    //   if (socket.currentDepartment) {
    //     socket.leave(socket.currentDepartment);
    //   }

    //   console.log(`Client disconnected ${socket.id}`);
    // });

    socket.on("disconnect", () => {
      onlineUsers.delete(userId);

      removeSocketFromSession(sessionId, socket.id);

      if (socket.currentDepartment) {
        socket.leave(socket.currentDepartment);
      }

      console.log(`Client disconnected ${socket.id}`);
    });
  
  });

  return io;
};

/* ============================
   SOCKET ACCESSORS
============================ */
export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

export const getOnlineUserSocket = (userId) => {
  return onlineUsers.get(userId);
};
