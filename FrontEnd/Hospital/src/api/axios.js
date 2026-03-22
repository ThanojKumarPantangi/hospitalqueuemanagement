import axios from "axios";
import { showToast } from "../utils/toastBus";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      showToast({
        type: "error",
        message: "Network error. Please check your connection.",
      });
      return Promise.reject(error);
    }

    const status = error.response.status;
    const code = error.response.data?.code;
    const url = originalRequest?.url || "";

    const isAuthEndpoint =
      url.includes("/api/auth/login") ||
      url.includes("/api/auth/refresh");

    /* ---------- TOKEN EXPIRED → REFRESH ---------- */

    const shouldRefresh =
      status === 401 &&
      code === "TOKEN_EXPIRED" &&
      !originalRequest._retry &&
      !isAuthEndpoint;

    if (shouldRefresh) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: () => resolve(api(originalRequest)),
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post("/api/auth/refresh");

        processQueue(null);

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);

        try {
          await api.post("/api/auth/logout");
        } catch {
          // 
        }

        showToast({
          type: "error",
          message: "Session expired. Please login again.",
        });

        window.location.href = "/login";

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    /* ---------- IMPORTANT: DO NOTHING ON NORMAL 401 ---------- */
    const publicRoutes = [
      "/login",
      "/verify-mfa",
      "/setup-mfa",
      "/verify-otp",
      "/signup",
      "/doctor-signup",
      "/"
    ];

    const isPublicRoute = publicRoutes.some((route) => url.includes(route));
    if(!isPublicRoute && status === 401){
      window.location.href = "/login";
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export default api;