import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Message from "../models/message.model.js";
import Session from "../models/session.model.js";
import cookie from "cookie";
import {
  addSocketToSession,
  removeSocketFromSession,
} from "./sessionSocketMap.js";

let io;

/* ============================
   ONLINE USER TRACKING
   (supports multi-tab)
============================ */
const onlineUsers = new Map(); // userId -> Set(socketId)

/* ============================
   INIT SOCKET
============================ */

export const initSocket = (server) => {

  io = new Server(server, {
    cors: {
      origin:process.env.FRONTEND_URL,
      credentials: true,
    },
  });

  /* ============================
     AUTH MIDDLEWARE
  ============================ */
  io.use(async (socket, next) => {
    try {
      const rawCookie = socket.handshake.headers.cookie;

      if (!rawCookie) {
        return next(new Error("Authentication error"));
      }

      const parsed = cookie.parse(rawCookie);
      const token = parsed.accessToken;
      
      if (!token) {
        return next(new Error("No access token"));
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

      if (!decoded?.id || !decoded?.sessionId) {
        return next(new Error("Invalid token payload"));
      }

      // 🔐 Session validation
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
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  /* ============================
     CONNECTION HANDLER
  ============================ */
  io.on("connection", async (socket) => {
    const { id: userId, role, sessionId } = socket.user;

    addSocketToSession(sessionId, socket.id);

    console.log(`Client connected ${socket.id} (user ${userId})`);

    /* ============================
       TRACK ONLINE USER (MULTI TAB)
    ============================ */
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    /* ============================
       USER PRIVATE ROOM
    ============================ */
    socket.join(`user:${userId}`);

    /* ============================
       AUTO JOIN ADMIN MONITOR
    ============================ */
    if (role === "ADMIN") {
      socket.join("admin-monitor");
      console.log(`Admin ${userId} auto-joined admin-monitor`);
    }

    /* ============================
       DEPARTMENT ROOM HANDLERS
       (Doctors / Patients only)
    ============================ */
    socket.on("join-department", async (departmentId) => {
      if (!departmentId || role === "ADMIN") return;

      if (
        socket.currentDepartment &&
        socket.currentDepartment !== departmentId
      ) {
        socket.leave(socket.currentDepartment);
      }

      socket.join(departmentId);
      socket.currentDepartment = departmentId;

      try {
        const undelivered = await Message.find({
          toUser: userId,
          deliveredAt: null,
          "metadata.departmentId": departmentId,
        }).sort({ createdAt: 1 });

        if (undelivered.length > 0) {
          socket.emit("messages:missed", undelivered);

          await Message.updateMany(
            { _id: { $in: undelivered.map(m => m._id) } },
            { $set: { deliveredAt: new Date() } }
          );
        }
      } catch (err) {
        console.error("Failed to replay missed messages:", err.message);
      }
    });

    socket.on("leave-department", (departmentId) => {
      if (!departmentId || role === "ADMIN") return;

      socket.leave(departmentId);
      if (socket.currentDepartment === departmentId) {
        socket.currentDepartment = null;
      }

      console.log(`Socket ${socket.id} left department ${departmentId}`);
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
    socket.on("disconnect", () => {
      console.log(`Client disconnected ${socket.id}`);

      removeSocketFromSession(sessionId, socket.id);

      // Remove socket from online users
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
        }
      }

      if (socket.currentDepartment) {
        socket.leave(socket.currentDepartment);
      }
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

/* ============================
   ONLINE USER SOCKETS
============================ */
export const getOnlineUserSockets = (userId) => {
  return onlineUsers.get(userId) || new Set();
};
