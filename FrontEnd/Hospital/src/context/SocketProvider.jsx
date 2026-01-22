import { useEffect, useRef, useCallback, useState } from "react";
import { io } from "socket.io-client";
import { SocketContext } from "./SocketContext";

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    const socket = io(
      import.meta.env.VITE_SOCKET_URL || "https://hospitalqueuemanagement.onrender.com",
      { 
        withCredentials: true,
        auth: {
          token: localStorage.getItem("accessToken"),
        },
      }
    );

    socketRef.current = socket;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socketRef, isConnected, disconnectSocket }}>
      {children}
    </SocketContext.Provider>
  );
};
