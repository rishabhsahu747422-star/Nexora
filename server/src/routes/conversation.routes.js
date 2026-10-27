import express from "express";
import { authMiddleware } from "../middlewares/authmiddleware.js";
import {
  getOrCreateConversation,
  getUserConversations,
  getConversationById,
  getConversationMessages,
  sendDirectMessage,
  deleteDirectMessage,
} from "../controllers/conversation.controller.js";
import upload from "../config/multer.config.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", getOrCreateConversation);
router.post("/dm", getOrCreateConversation);
router.get("/", getUserConversations);
router.get("/:conversationId", getConversationById);
router.get("/:conversationId/messages", getConversationMessages);
router.post("/:conversationId/messages", upload.array("files"), sendDirectMessage);
router.delete("/:conversationId/messages/:messageId", deleteDirectMessage);

export default router;
