import api from "../config/api.js";

export const createOrder = async () => {
  const response = await api.post("/payments/create-order");
  return response.data;
};

export const verifyNexPayment = async (paymentDetails) => {
  const response = await api.post("/payments/verify", paymentDetails);

  return response.data;
};

export const getMyNex = async () => {
  const response = await api.get("/payments/nex");

  return response.data;
};
