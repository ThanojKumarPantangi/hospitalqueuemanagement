import api from "./axios";

export const signupApi = (data) => {
  return api.post("/api/auth/signup", data);
};

export const doctorSignupApi = (data) => {
  return api.post("/api/auth/doctor-signup", data);
};

export const loginApi = (data, config = {}) => {
  return api.post("/api/auth/login", data, config);
};

export const sendotp = (data) => {
  return api.post("/api/otp/send", data);
};

export const verifyotp = (data) => {
  return api.post("/api/otp/verify", data);
};

export const setupmfa = (data, config = {}) => {
  return api.post("/api/auth/setup-mfa", data, config);
};

export const confirmmfa = (data, config = {}) => {
  return api.post("/api/auth/confirm-mfa", data, config);
};

export const verifymfaApi = (data, config = {}) => {
  return api.post("/api/auth/verify-mfa", data, config);
};


export const changePasswordControllerApi = (data) => {
  return api.patch("/api/users/change-password", data);
};