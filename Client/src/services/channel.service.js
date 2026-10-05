import api from "../config/api.js";

export const getChannels = async (serverId) => {
  const response = await api.get(`/channel/${serverId}/channels`);

  return response.data.data;
};

export const createChannel = async ({
  serverId,
  name,
  type,
  position,
  isPrivate,
}) => {
  const response = await api.post(`/channel/${serverId}/channels`, {
    name,
    type,
    position,
    isPrivate,
  });

  return response.data.data;
};

export const getChannel = async ({ serverId, channelId }) => {
  const response = await api.get(`/channel/${serverId}/channels/${channelId}`);

  return response.data.data;
};

export const updateChannel = async ({ serverId, channelId, ...payload }) => {
  const response = await api.patch(
    `/channel/${serverId}/channels/${channelId}`,
    payload,
  );

  return response.data.data;
};

export const deleteChannel = async ({ serverId, channelId }) => {
  const response = await api.delete(
    `/channel/${serverId}/channels/${channelId}`,
  );

  return response.data;
};
