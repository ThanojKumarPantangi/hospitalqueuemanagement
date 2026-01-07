// sessionId -> Set of socketIds
const sessionSocketMap = new Map();

export const addSocketToSession = (sessionId, socketId) => {
  if (!sessionSocketMap.has(sessionId)) {
    sessionSocketMap.set(sessionId, new Set());
  }
  sessionSocketMap.get(sessionId).add(socketId);
};

export const removeSocketFromSession = (sessionId, socketId) => {
  const set = sessionSocketMap.get(sessionId);
  if (!set) return;

  set.delete(socketId);
  if (set.size === 0) sessionSocketMap.delete(sessionId);
};

export const getSocketsBySession = (sessionId) => {
  return sessionSocketMap.get(sessionId) || new Set();
};
