import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import api from "../api/axios";
import { jwtDecode } from "jwt-decode";
import { useSocket } from "../hooks/useSocket";


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const { disconnectSocket } = useSocket();


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


  const login = (accessToken) => {
    localStorage.setItem("accessToken", accessToken);
    setUserFromToken(accessToken);
  };


  const setUserFromToken = (token) => {
    const decoded = jwtDecode(token);
    setUser({
      id: decoded.id,
      role: decoded.role,
      name: decoded.name,
    });
  };

  useEffect(() => {
    // 🚫 Skip auth init on auth pages
    if (["/login", "/signup","/logout","/verify-otp"].includes(location.pathname)) {
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
            setLoading(false);
            return;
          }
        } catch {
          // Nothing to write
        }
      }

      try {
        const res = await api.post("/api/auth/refresh");
        const newToken = res.data.accessToken;
        localStorage.setItem("accessToken", newToken);
        setUserFromToken(newToken);
      } catch {
        // ❌ DO NOT logout
        localStorage.removeItem("accessToken");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [location.pathname]);

  return (
    <AuthContext.Provider value={{ user, loading, login,logout }}>
      {children}
    </AuthContext.Provider>
  );
};
