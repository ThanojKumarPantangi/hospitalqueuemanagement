import api from "./axios";

export const getMyTokenApi = () => {
  return api.get("/api/queue/my");
};

export const getMyUpcomingTokensApi = (config = {}) => {
  return api.get("/api/queue/my/upcoming",config);
};

export const cancelTokenApi = (tokenId) =>{
  return api.patch(`/api/queue/${tokenId}/cancel`);
}
  
export const createTokenApi = (data) => {
  return api.post("/api/queue", data);
};

export const getAllDepartmentsApi=()=>{
  return api.get("/api/departments")
}

export const previewTokenNumberApi = ({ departmentId, appointmentDate }) => {
  return api.get("/api/queue/preview", {
    params: {
      departmentId,
      appointmentDate,
    },
  });
};


export const getTokenHistoryApi = () => {
  return api.get("/api/queue/history");
};