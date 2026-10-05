import express from "express";
import { authMiddleware } from "../middlewares/authmiddleware.js";
import {
  createMessage,
  getAllChannelMessage,
} from "../controllers/message.controller.js";
import upload from "../config/multer.config.js";

const router = express.Router();
(router.use(authMiddleware),
  router.post(
    "/:channelId/message",
    upload.array("attachements"),
    createMessage,
  ));
router.get("/:channelId/messages", getAllChannelMessage);
router.get("");

export default router;
