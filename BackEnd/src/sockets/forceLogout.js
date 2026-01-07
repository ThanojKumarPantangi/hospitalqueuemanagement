import { getSocketsBySession } from "./sessionSocketMap.js";

export const forceLogoutSession = (io, sessionId) => {
  const sockets = getSocketsBySession(sessionId);

  for (const socketId of sockets) {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit("SESSION_REVOKED");
      socket.disconnect(true);
    }
  }
};
