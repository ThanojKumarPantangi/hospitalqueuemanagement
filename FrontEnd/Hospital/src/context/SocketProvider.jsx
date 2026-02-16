import React, { useEffect, useRef, useCallback, useState } from "react";
import { io } from "socket.io-client";
import { SocketContext } from "./SocketContext";

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // const socket = io("https://hospitalqueuemanagement.onrender.com", {
    //   withCredentials: true,
    //   autoConnect: false,
    //   transports: ["websocket"],
    // });

    const socket = io("https://hospitalqueuemanagement.onrender.com", {
      auth: {
        token: document.cookie
          .split("; ")
          .find(row => row.startsWith("accessToken="))
          ?.split("=")[1],
      },
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
