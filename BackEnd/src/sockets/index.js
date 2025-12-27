import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  // 🔐 AUTH MIDDLEWARE
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      if (!token) return next(new Error("Authentication error"));

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

      socket.user = {
        id: decoded.id,
        role: decoded.role,
      };

      // Track current department room
      socket.currentDepartment = null;

      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.id;

    console.log(`Client connected ${socket.id} (user ${userId})`);

    // ✅ USER PRIVATE ROOM
    socket.join(`user:${userId}`);

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
       DISCONNECT CLEANUP
    ============================ */

    socket.on("disconnect", () => {
      if (socket.currentDepartment) {
        socket.leave(socket.currentDepartment);
      }
      console.log(`Client disconnected ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};
