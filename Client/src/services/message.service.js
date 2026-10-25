import api from "../config/api.js";

const data = (response) => response.data?.data ?? response.data;

export const getMessages = async (channelId) =>
  data(await api.get(`/messages/${channelId}/messages`));

export const createMessage = async (channelIdOrPayload, maybePayload) => {
  let channelId;
  let body;

  if (maybePayload !== undefined) {
    channelId = channelIdOrPayload;
    body = maybePayload;
  } else if (channelIdOrPayload?.contextId || channelIdOrPayload?.channelId) {
    channelId = channelIdOrPayload.contextId || channelIdOrPayload.channelId;
    body = {
      content: channelIdOrPayload.content,
    };
  } else {
    channelId = channelIdOrPayload;
    body = {};
  }

  return data(await api.post(`/messages/${channelId}/message`, body));
};

export const getMessage = async ({ channelId, messageId }) =>
  data(await api.get(`/messages/${channelId}/messages/${messageId}`));

export const updateMessage = async ({ channelId, messageId, ...payload }) =>
  data(await api.patch(`/messages/${channelId}/messages/${messageId}`, payload));

export const deleteMessage = async ({ channelId, messageId }) =>
  data(await api.delete(`/messages/${channelId}/messages/${messageId}`));
