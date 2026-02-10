import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import api from "../api/axios";
import { jwtDecode } from "jwt-decode"; // default import
import { useSocket } from "../hooks/useSocket";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const { connectSocket, disconnectSocket } = useSocket();

  const setUserFromToken = (token) => {
    try {
      const decoded = jwtDecode(token);
      setUser({
        id: decoded.id,
        role: decoded.role,
        name: decoded.name,
      });
    } catch (e) {
      console.warn("Invalid token in setUserFromToken:", e);
      setUser(null);
    }
  };

  const login = (accessToken) => {
    localStorage.setItem("accessToken", accessToken);
    setUserFromToken(accessToken);

    // connect socket after token saved
    connectSocket();
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // ignore backend failure
    } finally {
      disconnectSocket();
      setUser(null);
      localStorage.removeItem("accessToken");
    }
  };

  useEffect(() => {
    if (["/login", "/signup", "/logout", "/verify-otp"].includes(location.pathname)) {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      const token = localStorage.getItem("accessToken");

      if (token) {
        try {
          const decoded = jwtDecode(token);
          const now = Date.now() / 1000;
          if (decoded.exp > now) {
            setUserFromToken(token);
            connectSocket(); // <-- connect with existing token
            setLoading(false);
            return;
          }
        } catch (e) {
          // fall through to refresh
        }
      }

      try {
        const res = await api.post("/api/auth/refresh");
        const newToken = res.data.accessToken;
        if (newToken) {
          localStorage.setItem("accessToken", newToken);
          setUserFromToken(newToken);
          connectSocket(); // <- connect after refresh
        } else {
          localStorage.removeItem("accessToken");
          setUser(null);
        }
      } catch (e) {
        localStorage.removeItem("accessToken");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [location.pathname, connectSocket, disconnectSocket]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
