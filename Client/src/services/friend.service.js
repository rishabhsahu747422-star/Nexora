import api from "../config/api.js";

const data = (response) => response.data?.data ?? response.data;

export const getConnectionOverview = async () =>
  data(await api.get("/connections"));

export const searchConnections = async (query) =>
  data(await api.get(`/connections/search?q=${encodeURIComponent(query || "")}`));

export const sendConnectionRequest = async (payload) =>
  data(await api.post("/connections/request", payload));

export const acceptConnectionRequest = async (requestId) =>
  data(await api.post(`/connections/request/${requestId}/accept`));

export const declineConnectionRequest = async (requestId) =>
  data(await api.post(`/connections/request/${requestId}/decline`));

export const cancelConnectionRequest = async (requestId) =>
  data(await api.post(`/connections/request/${requestId}/cancel`));

export const removeConnection = async (friendId) =>
  data(await api.delete(`/connections/${friendId}`));
