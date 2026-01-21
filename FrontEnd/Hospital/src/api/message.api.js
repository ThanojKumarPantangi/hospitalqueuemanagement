import api from "./axios";

export const getMessageHistoryApi = ({ page, limit = 20 }) => {
  return api.get("/api/messages", {
    params: { page, limit },
  });
};

export const markMessagesReadApi = ({ messageIds }) => {
  return api.post("/api/messages/read", { messageIds });
};


export const sendDepartmentAnnouncementApi = ({ departmentId, title, content }) => {
  return api.post("/api/messages/department-announcement", { departmentId, title, content });
};

export const sendMessageApi = ({ toUserId, title, content, type, metadata }) => { 
  return api.post("/api/messages/send", { toUserId, title, content, type, metadata });
};