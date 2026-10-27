import api from "../config/api.js";

const data = (response) => response.data?.data ?? response.data;

export const createServer = async (payload) =>
  data(await api.post("/server/create", payload));

export const getServers = async () => data(await api.get(`/server`)).servers;

export const getServer = async (serverId) => {
  const response = await api.get(`/server/${serverId}`);
  return response.data.data;
};

export const updateServer = async (serverId, payload) =>
  data(await api.patch(`/server/${serverId}`, payload));

export const deleteServer = async (serverId) =>
  data(await api.delete(`/server/${serverId}`));

export const createInvite = async (serverId, payload = {}) =>
  data(await api.post(`/server/${serverId}/invite`, payload));

export const getInviteDetails = async (inviteCode) =>
  data(await api.get(`/server/invite/${inviteCode}`));

export const joinServer = async (inviteCode) =>
  data(await api.post(`/server/join/${inviteCode}`));

export const leaveServer = async (serverId) =>
  data(await api.delete(`/server/${serverId}/leave`));

export const getServerMembers = async (serverId) =>
  data(await api.get(`/serverMembers/${serverId}/members`));

export const removeServerMember = async (serverId, userId) =>
  data(await api.delete(`/serverMembers/${serverId}/members/${userId}`));

export const updateMemberRoles = async (serverId, userId, roles) =>
  data(await api.patch(`/serverMembers/${serverId}/members/${userId}/roles`, { roles }));
