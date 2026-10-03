import api from "../config/api.js";

const data = (response) => response.data?.data ?? response.data;

export const createServer = async (payload) =>
  data(await api.post("/servers", payload));

export const getServer = async (serverId) =>
  data(await api.get(`/servers/${serverId}`));

export const updateServer = async (serverId) =>
  data(await api.patch(`/server/${serverId}`));

export const deleteServer = async (serverId) =>
  data(await api.delete(`/server/${serverId}`));

export const createInvite = async (serverId) =>
  data(await api.post(`/server/${serverId}/invite`));

export const joinServer = async (inviteCode) =>
  data(await api.post(`/server/join/${inviteCode}`));
