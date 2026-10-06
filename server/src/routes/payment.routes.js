import express from "express";
import { authMiddleware } from "../middlewares/authmiddleware.js";
import {
  createOrder,
  getMyNex,
  verifyNexPayment,
} from "../controllers/payment.controller.js";

const router = express.Router();
router.post("/create-order", authMiddleware, createOrder);
router.post("/verify", authMiddleware, verifyNexPayment);
router.get("/nex", authMiddleware, getMyNex);
export default router;
