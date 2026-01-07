import api from "./axios";

export const getMySessionApi=()=>{
    return api.get("/api/sessions/my-sessions");
}

export const logoutSessionApi=(sessionId)=>{
    return api.post(`/api/sessions/logout/${sessionId}`);
}

export const logoutAllSessionsApi=()=>{
    return api.post("/api/sessions/logout-all");
}