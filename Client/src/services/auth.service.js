import api from "../config/api.js";

const extractUser = (response) => {
  return response?.data?.data || response?.data?.user || response?.data;
};

export const registerUser = async (data) => {
  const response = await api.post("/auth/register", data);
  return extractUser(response);
};

export const loginUser = async (data) => {
  const response = await api.post("/auth/login", data);
  return extractUser(response);
};

export const getMe = async () => {
  const response = await api.get("/auth/me");
  return extractUser(response);
};

export const logoutUser = async () => {
  const response = await api.post("/auth/logout");
  return response?.data;
};

export const refreshSession = async () => {
  const response = await api.post("/auth/refresh");
  return response?.data;
};

export const updateUserProfile = async (data) => {
  const response = await api.patch("/user/me", data);
  return extractUser(response);
};

export const searchUsers = async (query) => {
  const q = typeof query === "string" ? query.trim() : "";
  if (!q) return [];
  const response = await api.get(`/user/search?query=${encodeURIComponent(q)}`);
  const data = response?.data?.data ?? response?.data?.users ?? response?.data;
  return Array.isArray(data) ? data : [];
};

