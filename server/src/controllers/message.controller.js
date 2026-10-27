import { getIO } from "../config/soocket.js";
import channelModel from "../models/channel.model.js";
import messageModel from "../models/message.model.js";
import serverMemberModel from "../models/serverMember.model.js";
import sendFiles from "../services/storage.service.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const createMessage = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const { content } = req.body;

    const channel = await channelModel.findById(channelId);

    if (!channel) {
      throw new ApiError(404, "channel not found");
    }
    const member = await serverMemberModel.findOne({
      server: channel.server,
      user: req.user._id,
    });

    if (!member) {
      throw new ApiError(403, "You are not a member of the server");
    }

    const hasText = content && content.trim().length > 0;
    const hasFiles = req.files && req.files.length > 0;

    if (!hasText && !hasFiles) {
      throw new ApiError(400, "Message must contain text or an attachment");
    }

    let attachments = [];

    if (hasFiles) {
      attachments = await Promise.all(
        req.files.map(async (file) => {
          const uploadedFile = await sendFiles(file.buffer, file.originalname);

          return {
            url: uploadedFile.url,
            type: file.mimetype.startsWith("image/")
              ? "image"
              : file.mimetype.startsWith("video/")
                ? "video"
                : "file",
            name: file.originalname,
          };
        }),
      );
    }

    const message = await messageModel.create({
      content: content?.trim() || "",
      author_id: req.user._id,
      channel_id: channelId,
      attachments,
    });

    const messageDetails = await messageModel
      .findById(message._id)
      .populate("author_id", "profile_pic username fullname");

    const io = getIO();
    if (io) {
      io.to(`channel:${channelId}`).emit("message:new", messageDetails);
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, messageDetails, "Message created successfully"),
      );
  } catch (error) {
    next(error);
  }
};

export const getAllChannelMessage = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const channel = await channelModel.findById(channelId);

    if (!channel) {
      throw new ApiError(404, "channel not found");
    }

    const member = await serverMemberModel.findOne({
      server: channel.server,
      user: req.user._id,
    });

    if (!member) {
      throw new ApiError(403, "You are not the member of this server");
    }

    const messages = await messageModel
      .find({ channel_id: channel._id })
      .populate("author_id", "username fullname profile_pic")
      .sort({ createdAt: 1 });

    return res
      .status(200)
      .json(new ApiResponse(200, messages, "Messages fetched successfully"));
  } catch (error) {
    next(error);
  }
};

export const getMessage = async (req, res, next) => {
  try {
    const { channelId, messageId } = req.params;
    const message = await messageModel
      .findOne({ _id: messageId, channel_id: channelId })
      .populate("author_id", "profile_pic username fullname");

    if (!message) throw new ApiError(404, "Message not found");
    return res
      .status(200)
      .json(new ApiResponse(200, message, "message fetched successfully"));
  } catch (error) {
    next(error);
  }
};

export const updateMessage = async (req, res, next) => {
  try {
    const { channelId, messageId } = req.params;
    const message = await messageModel.findOne({
      _id: messageId,
      channel_id: channelId,
    });
    if (!message) throw new ApiError(404, "Message not found");
    if (message.author_id.toString() !== req.user._id.toString())
      throw new ApiError(403, "only author can update this message");
    message.content = req.body.content?.trim() ?? message.content;
    await message.save();
    const updatedMessage = await message.populate(
      "author_id",
      "profile_pic username fullname",
    );
    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedMessage, "message updated successfully"),
      );
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req, res, next) => {
  try {
    const { channelId, messageId } = req.params;
    const message = await messageModel.findOne({
      _id: messageId,
      channel_id: channelId,
    });

    if (!message) throw new ApiError(404, "message not found");

    if (message.author_id.toString() !== req.user._id.toString())
      throw new ApiError(403, "only author can delete the message");
    await messageModel.findByIdAndDelete(message._id);

    return res
      .status(200)
      .json(new ApiResponse(200, null, "message deleted successfully"));
  } catch (error) {
    next(error);
  }
};

export const toggleChannelMessageReaction = async (req, res, next) => {
  try {
    const { channelId, messageId } = req.params;
    const { emoji } = req.body;
    const currentUserId = (req.user._id || req.user.id).toString();

    if (!emoji || typeof emoji !== "string") {
      throw new ApiError(400, "Emoji is required");
    }

    const channel = await channelModel.findById(channelId);
    if (!channel) throw new ApiError(404, "Channel not found");

    const member = await serverMemberModel.findOne({
      server: channel.server,
      user: req.user._id,
    });
    if (!member) throw new ApiError(403, "You are not a member of the server");

    const message = await messageModel.findOne({
      _id: messageId,
      channel_id: channelId,
    });
    if (!message) throw new ApiError(404, "Message not found");

    if (!message.reactions) {
      message.reactions = [];
    }

    const existingReaction = message.reactions.find((r) => r.emoji === emoji);
    if (existingReaction) {
      const userIndex = existingReaction.users.findIndex(
        (u) => u.toString() === currentUserId
      );
      if (userIndex > -1) {
        existingReaction.users.splice(userIndex, 1);
        if (existingReaction.users.length === 0) {
          message.reactions = message.reactions.filter((r) => r.emoji !== emoji);
        }
      } else {
        existingReaction.users.push(req.user._id);
      }
    } else {
      message.reactions.push({
        emoji,
        users: [req.user._id],
      });
    }

    await message.save();

    const formattedReactions = message.reactions.map((r) => ({
      emoji: r.emoji,
      users: r.users.map((u) => u.toString()),
      count: r.users.length,
    }));

    const io = getIO();
    if (io) {
      io.to(`channel:${channelId}`).emit("channel:reaction", {
        channelId,
        messageId,
        reactions: formattedReactions,
      });
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        { messageId, channelId, reactions: formattedReactions },
        "Reaction updated successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};
