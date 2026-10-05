import express from "express";
import { authMiddleware } from "../middlewares/authmiddleware.js";
import { createOrder } from "../controllers/payment.controller.js";
import router from "./channel.routes";

router.post("/create-order", authMiddleware, createOrder);

export default router;
