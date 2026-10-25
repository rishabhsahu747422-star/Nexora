import conversationModel from "../models/conversation.model.js";
import directMessageModel from "../models/directMessage.model.js";
import userModel from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import sendFiles from "../services/storage.service.js";
import { getIO } from "../config/soocket.js";

export const getOrCreateConversation = async (req, res, next) => {
  try {
    const { recipientId } = req.body;
    const currentUserId = req.user._id || req.user.id;

    if (!recipientId) {
      throw new ApiError(400, "Recipient ID is required");
    }

    if (recipientId.toString() === currentUserId.toString()) {
      throw new ApiError(400, "You cannot start a direct conversation with yourself");
    }

    const recipient = await userModel.findById(recipientId);
    if (!recipient) {
      throw new ApiError(404, "Recipient user not found");
    }

    // Check for existing conversation with both participants
    let conversation = await conversationModel
      .findOne({
        participants: { $all: [currentUserId, recipientId] },
      })
      .populate("participants", "fullname username profile_pic");

    let isNew = false;
    if (!conversation) {
      conversation = await conversationModel.create({
        participants: [currentUserId, recipientId],
        lastMessage: {
          content: "Conversation created",
          sender: currentUserId,
          createdAt: new Date(),
        },
      });

      conversation = await conversationModel
        .findById(conversation._id)
        .populate("participants", "fullname username profile_pic");
      isNew = true;
    }

    return res
      .status(isNew ? 201 : 200)
      .json(new ApiResponse(isNew ? 201 : 200, conversation, "Conversation retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

export const getUserConversations = async (req, res, next) => {
  try {
    const currentUserId = req.user._id || req.user.id;

    const conversations = await conversationModel
      .find({
        participants: currentUserId,
      })
      .populate("participants", "fullname username profile_pic")
      .sort({ updatedAt: -1 });

    return res
      .status(200)
      .json(new ApiResponse(200, conversations, "Conversations fetched successfully"));
  } catch (error) {
    next(error);
  }
};

export const getConversationById = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = (req.user._id || req.user.id).toString();

    const conversation = await conversationModel
      .findById(conversationId)
      .populate("participants", "fullname username profile_pic");

    if (!conversation) {
      throw new ApiError(404, "Conversation not found");
    }

    const isParticipant = conversation.participants.some(
      (p) => (p._id || p).toString() === currentUserId
    );

    if (!isParticipant) {
      throw new ApiError(403, "You are not authorized to view this conversation");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, conversation, "Conversation fetched successfully"));
  } catch (error) {
    next(error);
  }
};

export const getConversationMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = (req.user._id || req.user.id).toString();

    const conversation = await conversationModel.findById(conversationId);
    if (!conversation) {
      throw new ApiError(404, "Conversation not found");
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === currentUserId
    );

    if (!isParticipant) {
      throw new ApiError(403, "You are not a participant in this conversation");
    }

    const messages = await directMessageModel
      .find({ conversation_id: conversationId })
      .populate("author_id", "fullname username profile_pic")
      .sort({ createdAt: 1 });

    // Mark messages as read by current user asynchronously
    await directMessageModel.updateMany(
      {
        conversation_id: conversationId,
        author_id: { $ne: currentUserId },
        readBy: { $ne: currentUserId },
      },
      {
        $addToSet: { readBy: currentUserId },
      }
    );

    return res
      .status(200)
      .json(new ApiResponse(200, messages, "Direct messages fetched successfully"));
  } catch (error) {
    next(error);
  }
};

export const sendDirectMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;
    const currentUserId = req.user._id || req.user.id;

    const conversation = await conversationModel.findById(conversationId);
    if (!conversation) {
      throw new ApiError(404, "Conversation not found");
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === currentUserId.toString()
    );

    if (!isParticipant) {
      throw new ApiError(403, "You are not a participant in this conversation");
    }

    const files = req.files || [];
    const hasText = content && content.trim().length > 0;
    const hasFiles = files && files.length > 0;

    if (!hasText && !hasFiles) {
      throw new ApiError(400, "Message must contain text content or attachments");
    }

    const attachments = [];
    for (const file of files) {
      const upload = await sendFiles(file.buffer, file.originalname);
      attachments.push({
        url: upload.url,
        fileType: file.mimetype.startsWith("image/")
          ? "image"
          : file.mimetype.startsWith("video/")
          ? "video"
          : "file",
        filename: file.originalname,
      });
    }

    const newMsg = await directMessageModel.create({
      conversation_id: conversationId,
      author_id: currentUserId,
      content: content ? content.trim() : "",
      attachments,
      readBy: [currentUserId],
    });

    const populatedMessage = await directMessageModel
      .findById(newMsg._id)
      .populate("author_id", "fullname username profile_pic");

    // Update conversation metadata
    conversation.lastMessage = {
      content: hasText ? content.trim() : "Sent an attachment",
      sender: currentUserId,
      createdAt: new Date(),
    };
    await conversation.save();

    // Socket.IO real-time emission
    const io = getIO();
    if (io) {
      io.to(`conversation:${conversationId}`).emit("direct-message:new", populatedMessage);

      // Notify recipient personal rooms for unread indicators
      conversation.participants.forEach((pId) => {
        io.to(`user:${pId.toString()}`).emit("conversation:update", {
          conversationId,
          lastMessage: conversation.lastMessage,
        });
      });
    }

    return res
      .status(201)
      .json(new ApiResponse(201, populatedMessage, "Direct message sent successfully"));
  } catch (error) {
    next(error);
  }
};

export const deleteDirectMessage = async (req, res, next) => {
  try {
    const { conversationId, messageId } = req.params;
    const currentUserId = (req.user._id || req.user.id).toString();

    const message = await directMessageModel.findOne({
      _id: messageId,
      conversation_id: conversationId,
    });

    if (!message) {
      throw new ApiError(404, "Direct message not found");
    }

    if (message.author_id.toString() !== currentUserId) {
      throw new ApiError(403, "You can only delete your own direct messages");
    }

    await directMessageModel.findByIdAndDelete(messageId);

    const io = getIO();
    if (io) {
      io.to(`conversation:${conversationId}`).emit("direct-message:delete", {
        messageId,
        conversationId,
      });
    }

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Direct message deleted successfully"));
  } catch (error) {
    next(error);
  }
};
