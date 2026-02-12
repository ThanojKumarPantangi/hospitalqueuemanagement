import axios from "axios";
import { showToast } from "../utils/toastBus";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      showToast({
        type: "error",
        message: "Network error. Please check your internet connection.",
      });
      return Promise.reject(error);
    }

    const status = error.response.status;
    const url = originalRequest?.url || "";

    const isMfaRoute =
      window.location.pathname === "/setup-mfa" ||
      window.location.pathname === "/verify-mfa";

    //  CRITICAL FIX
    if (status === 401 && url.includes("/api/auth/me") && isMfaRoute) {
      return Promise.reject(error); 
    }

    const shouldRefresh =
      status === 401 &&
      !originalRequest._retry &&
      !url.includes("/api/auth/login") &&
      !url.includes("/api/auth/refresh") &&
      !url.includes("/api/auth/me");

    if (shouldRefresh) {
      originalRequest._retry = true;

      try {
        await api.post("/api/auth/refresh");
        return api(originalRequest);
      } catch (refreshError) {
        try {
          await api.post("/api/auth/logout");
        } catch {
          // 
        }

        const message =
          refreshError?.response?.data?.message ||
          "Session expired. Please login again.";

        showToast({ type: "error", message });

        // window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);


export default api;
