import api from "../config/api.js";

const data = (response) => response.data?.data ?? response.data;

export const getMessages = async (channelId) =>
  data(await api.get(`/channels/${channelId}/messages`));

export const createMessage = async (channelId, formData) =>
  data(await api.post(`/channel/${channelId}/message`, formData));

export const getMessage = async ({ channelId, messageId }) =>
  data(await api.get(`/channel/${channelId}/messsages/${messageId}`));

export const updateMessage = async ({ channelId, messageId, ...payload }) =>
  data(await api.patch(`/channel/${channelId}/messages/${messageId}`, payload));

export const deleteMessage = async ({ channelId, messageId }) =>
  data(await api.delete(`/channel/${channelId}/messages/${messageId}`));
