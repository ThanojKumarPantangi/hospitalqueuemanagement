import axios from "axios";
import { showToast } from "../utils/toastBus";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

/* ---------- GLOBAL STATE ---------- */
let refreshPromise = null;
let failedQueue = [];

/* ---------- PROCESS QUEUE ---------- */
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

/* ---------- INTERCEPTOR ---------- */
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    /* ---------- NETWORK ERROR ---------- */
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

    /* ---------- SHOULD REFRESH ---------- */
    const shouldRefresh =
      status === 401 &&
      code === "TOKEN_EXPIRED" &&
      !originalRequest._retry &&
      !isAuthEndpoint;

    if (shouldRefresh) {
      // mark retry early to avoid loops
      originalRequest._retry = true;

      /* ---------- CREATE SINGLE REFRESH PROMISE ---------- */
      if (!refreshPromise) {
        refreshPromise = api
          .post("/api/auth/refresh")
          .then(() => {
            processQueue(null);
          })
          .catch(async (refreshError) => {
            processQueue(refreshError);

            try {
              await api.post("/api/auth/logout");
            } catch {
              // ignore
            }

            showToast({
              type: "error",
              message: "Session expired. Please login again.",
            });

            window.location.href = "/login";

            throw refreshError;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      /* ---------- QUEUE REQUEST ---------- */
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: () => resolve(api(originalRequest)),
          reject,
        });
      });
    }

    /* ---------- NORMAL 401 HANDLING ---------- */
    const publicRoutes = [
      "/login",
      "/verify-mfa",
      "/setup-mfa",
      "/verify-otp",
      "/signup",
      "/doctor-signup",
      "/",
    ];

    const isVercelInsights = url.includes("/_vercel/speed-insights/");

    const isPublicRoute = publicRoutes.some((route) =>
      url.includes(route)
    );

    if (!isPublicRoute && !isVercelInsights && status === 401) {
      window.location.href = "/login";
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;