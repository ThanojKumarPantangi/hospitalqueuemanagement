// SocketProvider.jsx
import React, { useEffect, useRef, useCallback, useState } from "react";
import { io } from "socket.io-client";
import { SocketContext } from "./SocketContext";

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Create single socket instance but don't autoConnect.
    const socket = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
      autoConnect: false,
      // optional: specify transports if server needs it
      // transports: ["websocket", "polling"],
    });

    // Standard connection status listeners
    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => {
      setIsConnected(false);
      // optional: log reason
      // console.debug("socket disconnected:", reason);
    });

    // Helpful debug for auth/connect problems
    socket.on("connect_error", (err) => {
      console.warn("Socket connect_error:", err && err.message ? err.message : err);
    });

    // Before every automatic reconnect attempt, re-inject the latest token
    // This ensures reconnects (and reconnection attempts) use a fresh token.
    socket.on("reconnect_attempt", () => {
      try {
        const t = localStorage.getItem("accessToken");
        if (t) {
          // If your server expects "Bearer <token>" use that string instead:
          // socket.auth = { token: `Bearer ${t}` };
          socket.auth = { token: t };
        }
      } catch (e) {
        // ignore
      }
    });

    socketRef.current = socket;

    // If a token already exists at mount (page reload case), connect immediately
    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        socket.auth = { token };
        socket.connect();
      }
    } catch (e) {
      // ignore
    }

    return () => {
      try {
        socket.removeAllListeners();
        socket.disconnect();
      } catch (e) {
        // ignore cleanup errors
      }
      socketRef.current = null;
      setIsConnected(false);
    };
  }, []);

  // Used by AuthProvider when user logs in or token refreshed manually
  const connectSocket = useCallback(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    // Use whatever format your server expects:
    // socket.auth = { token: `Bearer ${token}` }; // if server expects "Bearer "
    socket.auth = { token };

    if (!socket.connected) {
      socket.connect();
    }
  }, []);

  const disconnectSocket = useCallback(() => {
    const socket = socketRef.current;
    if (!socket) {
      setIsConnected(false);
      return;
    }
    if (socket.connected) socket.disconnect();
    setIsConnected(false);
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socketRef,
        isConnected,
        connectSocket,
        disconnectSocket,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
