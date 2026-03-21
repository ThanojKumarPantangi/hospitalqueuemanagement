import { useEffect, useState, useRef } from "react";
import { AuthContext } from "./AuthContext";
import api from "../api/axios";
import { useSocket } from "../hooks/useSocket";
import { useLocation } from "react-router-dom";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const { connectSocket, disconnectSocket } = useSocket();
  const fetchedRef = useRef(false);
  const location = useLocation();

  const fetchUser = async () => {
    try {
      const res = await api.get("/api/auth/me");
      setUser(res.data);
    } catch (err) {
      if (err?.response?.status === 401) {
        setUser(null); 
      } else {
        console.error("Unexpected auth error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const publicRoutes = [
      "/login",
      "/verify-mfa",
      "/setup-mfa",
      "/verify-otp",
    ];

    
    if (publicRoutes.includes(location.pathname)) {
      setLoading(false);
      return;
    }

    
    if (fetchedRef.current) return;

    fetchedRef.current = true;
    fetchUser();
  }, [location.pathname]);

  useEffect(() => {
    if (!user) {
      disconnectSocket();
      return;
    }

    connectSocket();

    return () => disconnectSocket();
  }, [user, connectSocket, disconnectSocket]);

  const login = async () => {
    fetchedRef.current = false; 
    await fetchUser();
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // ignore
    }

    fetchedRef.current = false;
    setUser(null);
    disconnectSocket();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};