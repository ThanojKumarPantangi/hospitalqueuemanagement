import api from "./axios";

export const verifyPatientQrApi = (qrText) => {
return api.post("/api/admin/verify-patient-qr", { qrText });
};

export const getAdminDashboardSummaryApi=()=>{
  return api.get("/api/admin/dashboard/summary")
}

export const getDepartmentsStatusApi=()=>{
  return api.get("/api/admin/departments/status")
}

export const createDepartmentApi=(payload)=>{
  return api.post("/api/admin/department",payload)
}

export const updateDepartmentApi=(departmentId,payload)=>{
  return api.patch(`/api/admin/${departmentId}`,payload) 
}

export const updateDepartmentStatusApi = (departmentId, isOpen) => {
  return api.patch(`/api/admin/departments/${departmentId}/status`, {
    isOpen,
  });
};

export const verifyDoctorApi=(payload)=>{
  return api.patch("/api/admin/verify-doctor",payload)
}

export const getNotVerifiedDoctorsApi=()=>{
  return api.get("/api/admin/doctor/not-verified")
}

export const createAdminApi=(payload)=>{
  return api.post("/api/admin/create-admin",payload)
}   

export const getDoctorsApi=()=>{
  return api.get("/api/admin/doctors")
}

export const markDoctorOnLeaveApi=(payload)=>{
  return api.patch("/api/admin/doctor/on-leave",payload)
}

export const markDoctorAvailableApi=(payload)=>{
  return api.patch("/api/admin/doctor/return-from-leave",payload)
}

export const markDoctorInactiveApi=(payload)=>{
  return api.patch("/api/admin/doctor/inactive",payload)
}

export const activateDoctorApi=(payload)=>{
  return api.patch("/api/admin/doctor/activate",payload)
}

export const getDoctorProfileApi=(userId)=>{
  return api.get(`/api/doctorProfile/${userId}`)
}

export const updateDoctorProfileApi=(userId,payload)=>{
  return api.post(`/api/doctorProfile/${userId}`,payload)
}

export const getAllDepartmentsApi=()=>{
  return api.get("/api/departments")
}

export const createDoctorApi=(payload)=>{
  return api.post("/api/admin/doctor",payload)
}

export const updateDoctorDepartmentsApi=(doctorId,payload)=>{
  return api.patch(`/api/admin/departments/${doctorId}`,payload)
}

export const lookupUserByPhoneOrEmailApi = (payload) => {
  return api.get("/api/admin/lookup", { params: payload });
};