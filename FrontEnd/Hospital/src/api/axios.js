import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
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

    if (!error.response) {
      return Promise.reject(error);
    }

    if (
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/api/auth/login") &&
      !originalRequest.url.includes("/api/auth/refresh")
    ) {
      originalRequest._retry = true;

      try {
    
        const res = await api.post("/api/auth/refresh");

        const newAccessToken = res.data.accessToken;

        // Save new access token
        localStorage.setItem("accessToken", newAccessToken);

        // Update header and retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed → force logout
        localStorage.removeItem("accessToken");
        await api.post("/api/auth/logout");
        // Optional: redirect to login
        window.location.href = "/login";

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
