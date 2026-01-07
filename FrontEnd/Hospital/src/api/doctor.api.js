import api from "./axios";

export const getMyDoctorProfileApi = () => {
  return api.get("/api/doctors/me");
};

export const updateDoctorProfileApi=(payload)=>{
    return api.patch("api/doctors/me",payload)
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