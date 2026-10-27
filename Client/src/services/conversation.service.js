import api from "../config/api.js";

const data = (response) => response.data?.data ?? response.data;

export const getConversations = async () =>
  data(await api.get("/conversations"));

export const openOrCreateConversation = async (recipientId) =>
  data(await api.post("/conversations", { recipientId }));

export const getConversation = async (conversationId) =>
  data(await api.get(`/conversations/${conversationId}`));

export const getConversationMessages = async (conversationId) =>
  data(await api.get(`/conversations/${conversationId}/messages`));

export const sendDirectMessage = async (conversationId, payload) => {
  const isFormData = typeof FormData !== "undefined" && payload instanceof FormData;
  const config = isFormData
    ? { headers: { "Content-Type": "multipart/form-data" } }
    : {};

  return data(await api.post(`/conversations/${conversationId}/messages`, payload, config));
};

export const deleteDirectMessage = async ({ conversationId, messageId }) =>
  data(await api.delete(`/conversations/${conversationId}/messages/${messageId}`));

export const toggleDirectMessageReaction = async ({ conversationId, messageId, emoji }) =>
  data(await api.post(`/conversations/${conversationId}/messages/${messageId}/reactions`, { emoji }));
