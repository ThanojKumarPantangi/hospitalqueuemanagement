import api from "./axios";


export const getPatientVisitsApi = () => {
  return api.get(`/api/visits/me`);
};
