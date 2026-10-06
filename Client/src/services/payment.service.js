import { createOrder } from "../../../server/src/controllers/payment.controller.js";
import api from "../config/api.js";

export const createNitroOrder = async () => {
  const response = await api.post("/payments/create-order", createOrder);

  return response.data;
};

export const verifyNitroPayment = async (paymentDetails) => {
  const response = await api.post("/payments/verify", paymentDetails);

  return response.data;
};

export const getMyNitro = async () => {
  const response = await api.get("/payments/nex+");

  return response.data;
};
