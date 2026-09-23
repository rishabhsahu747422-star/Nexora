import express from "express";
import { authMiddleware } from "../middlewares/authmiddleware.js";
import { createMessage } from "../controllers/message.controller.js";

const router = express.Router();
router.post("/create/:channelId", authMiddleware, createMessage);

export default router;
