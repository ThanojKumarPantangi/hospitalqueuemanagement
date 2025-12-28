import api from "./axios";

export const getMyTokenApi = () => {
  return api.get("/api/tokens/my");
};


export const getMyUpcomingTokensApi = (config = {}) => {
  return api.get("/api/tokens/my/upcoming",config);
};

export const cancelTokenApi = (tokenId) =>{
  return api.patch(`/api/tokens/${tokenId}/cancel`);
}
  
export const createTokenApi = (data) => {
  return api.post("/api/tokens", data);
};

export const getAllDepartmentsApi=()=>{
  return api.get("/api/departments")
}

export const previewTokenNumberApi = ({ departmentId, appointmentDate }) => {
  return api.get("/api/tokens/preview", {
    params: {
      departmentId,
      appointmentDate,
    },
  });
};


export const getTokenHistoryApi = () => {
  return api.get("/api/tokens/history");
};