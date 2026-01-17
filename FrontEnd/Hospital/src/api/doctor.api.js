import api from "./axios";

export const getMyDoctorProfileApi = () => {
  return api.get("/api/doctors/me");
};

export const updateDoctorProfileApi=(payload)=>{
    return api.post("api/doctors/me",payload)
}

export const callNextPatientApi=()=>{
    return api.post("/api/tokens/doctor/call-next");
}

export const completeCurrentTokenApi=()=>{
    return api.post("/api/tokens/doctor/complete");
}

export const skipCurrentTokenApi=()=>{
    return api.post("/api/tokens/doctor/skip");
}

export const getDoctorQueueSummary=()=>{
  return api.get(`/api/tokens/dashboard/queue-summary`)
}

export const makeDoctorOnLeaveApi=()=>{
  return api.patch(`/api/admin/doctor/on-leave`)
}

export const makeDoctorOnAvailableApi=()=>{
  return api.patch(`/api/admin/doctor/return-from-leave`)
}

export const patientProfileApi = (patientId) => {
  if (!patientId || typeof patientId !== "string") {
    throw new Error("patientProfileApi requires a patientId string");
  }

  return api.get(`/api/patient-profile/${patientId}`);
};
