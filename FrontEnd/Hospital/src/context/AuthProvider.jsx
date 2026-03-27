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
      localStorage.setItem("isAuthInitialized", "true");
    } catch (err) {
      if (err?.response?.status === 401) {
        setUser(null);
        localStorage.removeItem("isAuthInitialized");
      } else {
        console.error("Unexpected auth error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const isAuthInitialized = localStorage.getItem("isAuthInitialized") === "true";
    const publicRoutes = [
      "/",
      "/login",
      "/verify-mfa",
      "/setup-mfa",
      "/verify-otp",
      "/forgot",
      "/reset",
      "/forgot-password",
      "/reset-password",
      "/doctor-signup",
      "/signup",
    ];

    const isPublicRoute = publicRoutes.includes(location.pathname) ||
      location.pathname.startsWith("/reset") ||
      location.pathname.startsWith("/forgot");

    if (isPublicRoute && !isAuthInitialized) {
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
    localStorage.setItem("isAuthInitialized", "true");
    await fetchUser();
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // ignore
    }

    fetchedRef.current = false;
    localStorage.removeItem("isAuthInitialized");
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