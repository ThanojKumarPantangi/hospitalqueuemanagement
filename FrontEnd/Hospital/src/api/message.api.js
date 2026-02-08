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

export const sendGlobalWaitingPatientsApi = ({ title, content }) => {
  return api.post("/api/messages/global/waiting-patients", { title, content });
};

export const sendGlobalActiveDoctorsApi = ({ title, content }) => {
  return api.post("/api/messages/global/active-doctors", { title, content });
};

export const sendMessageToAdminApi = ({ title, content, category }) => {
  return api.post("/api/messages/to-admin", {
    title,
    content,
    category,
  });
};

export const getAdminThreadsApi = () => {
  return api.get("/api/messages/admin/threads");
};

export const getThreadMessagesApi = (threadId) => {
  return api.get(`/api/messages/thread/${threadId}`);
};

export const getUserThreadsApi = () => {
  return api.get("/api/messages/my/threads");
};

export const getUserThreadMessagesApi = (threadId) => {
  return api.get(`/api/messages/my/thread/${threadId}`);
};

export const replyToThreadApi = ({ threadId, title, content, category }) => {
  return api.post("/api/messages/reply", {
    threadId,
    title,
    content,
    category,
  });
};

export const previewRecipientsApi = ({ mode, departmentId }) => {
  return api.get("/api/messages/preview", {
    params: { mode, departmentId },
  });
};

export const closeTicketApi = (threadId) => {
  return api.post(`/api/messages/tickets/${threadId}/close`);
};