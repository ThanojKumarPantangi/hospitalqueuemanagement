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

export const getSecurityEventsApi=()=>{
    return api.get("/api/sessions/security-events");
}

export const markSecurityEventAsReadApi=(id)=>{
    return api.patch(`/api/sessions/security-events/${id}/read`);
}

export const markAllSecurityEventsAsReadApi=()=>{
    return api.patch("/api/sessions/security-events/mark-all-read");
}