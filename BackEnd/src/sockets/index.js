import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Message from "../models/message.model.js";
import Session from "../models/session.model.js";
import ConsultationSession from "../models/consultationSession.model.js";
import cookie from "cookie";
import {
  addSocketToSession,
  removeSocketFromSession,
} from "./sessionSocketMap.js";

let io;

/* ============================
   INIT SOCKET
============================ */

export const initSocket = (server) => {

  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    },
  });

  const roomCallMap = new Map();

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
       USER PRIVATE ROOM
    ============================ */

    socket.join(`user:${userId}`);

    /* ============================
       ADMIN MONITOR
    ============================ */

    if (role === "ADMIN") {
      socket.join("admin-monitor");
      console.log(`Admin ${userId} auto-joined admin-monitor`);
    }

    /* ============================
       DEPARTMENT ROOM
    ============================ */

    socket.on("join-department", async (departmentId) => {

      if (!departmentId || role === "ADMIN") return;

      if (
        socket.currentDepartment &&
        socket.currentDepartment !== departmentId
      ) {
        socket.leave(socket.currentDepartment);
      }

      if (!socket.rooms.has(departmentId)) {
        socket.join(departmentId);
        socket.currentDepartment = departmentId;
        console.log(`Socket ${socket.id} join department ${departmentId}`);
      }

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
       WEBRTC SIGNALING
    ============================ */

    let callId = roomCallMap.get(roomId);

    if (!callId) {
      callId = Date.now().toString();
      roomCallMap.set(roomId, callId);
    }

    socket.on("webrtc:join-room", async ({ roomId, userType }) => {

      if (!roomId) return;

      try {

        const userId = socket.user.id;

        if (!["doctor", "patient"].includes(userType)) {
          socket.emit("webrtc:join-denied", { reason: "Invalid user type" });
          return;
        }

        if (socket.webrtcRoom) {
          socket.emit("webrtc:join-denied", { reason: "Already in a room" });
          return;
        }

        let session;

        /* ==========================
          DOCTOR JOIN (Atomic)
        ========================== */

        if (userType === "doctor" && socket.user.role === "DOCTOR") {

          session = await ConsultationSession.findOneAndUpdate(
            {
              roomId,
              doctor: userId,
              active: true,
              doctorJoined: false
            },
            {
              $set: {
                doctorJoined: true,
                startedAt: new Date()
              }
            },
            { new: true }
          );

          if (!session) {
            socket.emit("webrtc:join-denied", {
              reason: "Doctor already joined or session inactive"
            });
            return;
          }

        }

        /* ==========================
          PATIENT JOIN (Atomic)
        ========================== */

        if (userType === "patient") {

          session = await ConsultationSession.findOneAndUpdate(
            {
              roomId,
              patient: userId,
              active: true,
              doctorJoined: true,
              patientJoined: false
            },
            {
              $set: {
                patientJoined: true
              }
            },
            { new: true }
          );

          if (!session) {
            socket.emit("webrtc:join-denied", {
              reason: "Doctor has not started consultation"
            });
            return;
          }

        }

        /* ==========================
          SAFE ROOM JOIN
        ========================== */

        socket.join(roomId);
        socket.webrtcRoom = roomId;

        const room = io.sockets.adapter.rooms.get(roomId);
        const roomSize = room ? room.size : 0;

        console.log(`${userType} joined room ${roomId}`);

        if (roomSize === 1) {

          socket.emit("webrtc:room-created",{ callId });

        } else {

          socket.emit("webrtc:room-joined",{ callId });
          socket.to(roomId).emit("webrtc:user-joined");

        }

      } catch (error) {

        console.error("Join room error:", error);
        socket.emit("webrtc:join-denied", { reason: "Server error" });

      }

    });

    socket.on("webrtc:offer", ({ roomId, offer,callId }) => {

      socket.to(roomId).emit("webrtc:offer", {
        offer,
        sender: socket.id,
        callId
      });

    });

    socket.on("webrtc:answer", ({ roomId, answer, callId}) => {

      socket.to(roomId).emit("webrtc:answer", {
        answer,
        sender: socket.id,
        callId
      });

    });

    socket.on("webrtc:ice-candidate", ({ roomId, candidate, callId}) => {

      socket.to(roomId).emit("webrtc:ice-candidate", {
        candidate,
        sender: socket.id,
        callId
      });

    });
    
    socket.on("webrtc:leave-room", async () => {

      const roomId = socket.webrtcRoom;
      if (!roomId) return;
      socket.leave(roomId);
      try {
        const session = await ConsultationSession.findOne({
          roomId,
          active: true
        });

        if (session) {
          const userId = socket.user.id;

          if (session.patient.toString() === userId) {
            session.patientJoined = false;
          }

          if (session.doctor.toString() === userId) {
            session.doctorJoined = false;
          }

          if (!session.patientJoined && !session.doctorJoined) {
            session.active = false;
            session.endedAt = new Date();
            roomCallMap.delete(roomId);
          }
          await session.save();
        }
      } catch (err) {
        console.error("Session cleanup error:", err);
      }
      socket.to(roomId).emit("webrtc:user-left", {
        socketId: socket.id
      });
      socket.webrtcRoom = null;
    });


    /* ============================
       DISCONNECT CLEANUP
    ============================ */

    socket.on("disconnect", () => {

      console.log(`Client disconnected ${socket.id}`);

      removeSocketFromSession(sessionId, socket.id);

      if (socket.currentDepartment) {
        socket.leave(socket.currentDepartment);
      }

      /* WebRTC cleanup */

      const roomId = socket.webrtcRoom;

      if (!roomId) return;

      socket.to(roomId).emit("webrtc:user-left", {
        socketId: socket.id
      });

      console.log(`Socket ${socket.id} disconnected from ${roomId}`);

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
