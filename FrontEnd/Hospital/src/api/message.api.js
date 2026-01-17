import api from "./axios";

export const getMessageHistoryApi = ({ page, limit = 20 }) => {
  return api.get("/api/messages", {
    params: { page, limit },
  });
};

export const markMessagesReadApi = ({ messageIds }) => {
  return api.post("/api/messages/read", { messageIds });
};
