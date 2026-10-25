import api from "../config/api.js";

export const registerUser = async (data) => {
  const response = await api.post("/auth/register", data);
  return response.data.user;
};

export const loginUser = async (data) => {
  const response = await api.post("/auth/login", data);
  return response.data.user;
};

export const getMe = async () => {
  const response = await api.get("/auth/me");
  return response.data.user;
};

export const logoutUser = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};

export const refreshSession = async () => {
  const response = await api.post("/auth/refresh");
  return response.data;
};

export const updateUserProfile = async (data) => {
  const response = await api.patch("/user/me", data);
  return response.data.data;
};

export const searchUsers = async (query) => {
  const response = await api.get(`/user/search?query=${encodeURIComponent(query)}`);
  return response.data.data;
};
