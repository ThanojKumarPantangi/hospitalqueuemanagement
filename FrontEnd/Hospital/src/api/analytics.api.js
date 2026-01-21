import api from "./axios"; // adjust path if your axios.js is elsewhere

export const analyticsApi = {
  dailyPatientCount: () => api.get("/api/analytics/daily-patient-count"),

  departmentLoad: () => api.get("/api/analytics/department-load"),

  doctorWorkload: (range = "today") =>
    api.get(`/api/analytics/doctor-workload?range=${range}`),

  todayAvgWaitingTime: () => api.get("/api/analytics/waiting-time/today"),

  throughput: (range = "today") =>
    api.get(`/api/analytics/throughput?range=${range}`),

  cancelRate: (range = "today") =>
    api.get(`/api/analytics/cancel-rate?range=${range}`),

  doctorUtilization: (range = "today") =>
    api.get(`/api/analytics/doctor-utilization?range=${range}`),

  liveQueue: () => api.get("/api/analytics/live-queue"),

  patientTrend: (days = 7) =>
    api.get(`/api/analytics/patient-trend?days=${days}`),

  departmentPeakHours: (date) =>
    api.get(`/api/analytics/department-peak-hours?date=${date}`),
};
