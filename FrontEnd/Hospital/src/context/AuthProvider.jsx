import { useEffect, useState, useCallback } from "react";
import { AuthContext } from "./AuthContext";
import api from "../api/axios";
import { useSocket } from "../hooks/useSocket";
import { useLocation } from "react-router-dom";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { connectSocket, disconnectSocket } = useSocket();
  const location = useLocation();

  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get("/api/auth/me");
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async () => {
    await fetchUser();
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      //
    }

    setUser(null);
    disconnectSocket();
  };

  useEffect(() => {
    const pathname = location.pathname;

    const publicRoutes = [
      "/login",
      "/signup",
      "/doctor-signup",
      "/forgot-password",
      "/verify-otp",
    ];

    const mfaRoutes = [
      "/setup-mfa",
      "/verify-mfa",
    ];

    const isPublic = publicRoutes.includes(pathname);
    const isMfaStage = mfaRoutes.includes(pathname);

    // During MFA stage → DO NOT validate session
    if (isPublic || isMfaStage) {
      setLoading(false);
      return;
    }

    // Only validate session for protected routes
    fetchUser();

  }, [fetchUser, location.pathname]);

  // Socket depends strictly on authenticated user
  useEffect(() => {
    if (user) {
      connectSocket();
    } else {
      disconnectSocket();
    }
  }, [user, connectSocket, disconnectSocket]);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
