// src/api/axios.js
import axios from "axios";
import { showToast } from "../utils/toastBus";

const api = axios.create({
  baseURL:import.meta.env.VITE_API_URL,
  withCredentials: true,
});

/* ============================
   REQUEST INTERCEPTOR
   ============================ */
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ============================
   RESPONSE INTERCEPTOR
   ============================ */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Network / server down
    if (!error.response) {
      showToast({
        type: "error",
        message: "Network error. Please check your internet connection.",
      });
      return Promise.reject(error);
    }

    const status = error.response.status;
    const url = originalRequest?.url || "";

    // Refresh only when:
    // - got 401
    // - not already retried
    // - not login/refresh call
    const shouldRefresh =
      status === 401 &&
      !originalRequest._retry &&
      !url.includes("/api/auth/login") &&
      !url.includes("/api/auth/refresh");

    if (shouldRefresh) {
      originalRequest._retry = true;

      try {
        // refresh token cookie is sent automatically
        const res = await api.post("/api/auth/refresh");
        const newAccessToken = res.data.accessToken;

        localStorage.setItem("accessToken", newAccessToken);

        // retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // refresh failed -> logout + redirect
        localStorage.removeItem("accessToken");

        const code = refreshError?.response?.data?.code;
        const message = refreshError?.response?.data?.message;

        // clear refresh cookie in backend (logout does NOT require access token now)
        try {
          await api.post("/api/auth/logout");
        } catch (err) {
          console.log("Failed to clear refresh cookie",err);
        }

        if (code === "REFRESH_TOKEN_REUSE") {
          showToast({
            type: "error",
            message:
              message ||
              "Security alert: suspicious session activity detected. Please login again.",
          });
        } else if (code === "SESSION_EXPIRED") {
          showToast({
            type: "error",
            message: message || "Session expired. Please login again.",
          });
        } else {
          showToast({
            type: "error",
            message: message || "Unauthorized. Please login again.",
          });
        }

        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
