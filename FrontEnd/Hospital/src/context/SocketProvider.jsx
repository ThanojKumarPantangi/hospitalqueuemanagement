import React, { useEffect, useRef, useCallback, useState } from "react";
import { io } from "socket.io-client";
import { SocketContext } from "./SocketContext";

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
      autoConnect: false,
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connect_error:", err?.message || err);
    });

    socketRef.current = socket;

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, []);

  const connectSocket = useCallback(() => {
    const socket = socketRef.current;
    if (!socket) return;
    if (!socket.connected) socket.connect();
  }, []);

  const disconnectSocket = useCallback(() => {
    const socket = socketRef.current;
    if (!socket) return;
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
