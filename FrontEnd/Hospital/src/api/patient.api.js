import api from "./axios";

export const getMyPatientProfileApi = () => {
  return api.get("/api/patient-profile/me");
};

export const updatePatientProfileApi = (payload) => {
  return api.post("/api/patient-profile/me", payload);
};

export const getPatientQrApi = () => {
return api.get("/api/patient-profile/my-qr");
};