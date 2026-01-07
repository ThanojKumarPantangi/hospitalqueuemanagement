import api from "./axios";


export const getPatientVisitsApi = () => {
  return api.get(`/api/visits/me`);
};

export const getDoctorPatientVisitsApi = (patientId) => {
  return api.get(`/api/visits/patient/${patientId}`);
};

export const createVisitApi = (payload) => {
  return api.post("/api/visits", payload);
};