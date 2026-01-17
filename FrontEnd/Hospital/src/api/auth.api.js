import api from "./axios";

export const signupApi = (data) => {
  return api.post("/api/auth/signup", data);
};

export const doctorSignupApi = (data) => {
  return api.post("/api/auth/doctor-signup", data);
};

export const loginApi = (data) => {
  return api.post("/api/auth/login", data);
};

export const sendotp = (data) => {
  return api.post("/api/otp/send", data);
};

export const verifyotp = (data) => {
  return api.post("/api/otp/verify", data);
};