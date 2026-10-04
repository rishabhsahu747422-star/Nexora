import { getIO } from "../config/soocket.js";
import channelModel from "../models/channel.model.js";
import messageModel from "../models/message.model.js";
import serverMemberModel from "../models/serverMember.model.js";
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

    if (!content || (!content.trim() && !req.files) || req.files.length === 0) {
      throw new ApiError(404, "Message must contain text or an attachment");
    }

    let attachments = [];

    if (req.files && req.files.lenth > 0) {
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
      author: req.user._id,
      channel: channelId,
      attachments,
    });

    const messageDetails = await messageModel
      .findById(message._id)
      .populate("author_id", "profile_pic username");
    const io = getIO();

    io.to(`channel:${channelId}`).emit("message:new", messageDetails);
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

    const message = await messageModel.aggregate([
      {
        $match: {
          channel_id: channel._id,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "author_id",
          foreignField: "_id",
          as: "auhtor_details",
        },
      },
      {
        $unwind: "$author_details",
      },
      {
        $project: {
          content: 1,
          createdAt: 1,
          "author_details.username": 1,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);

    return res.status(200).json(200, message, "message fetched sccesfully");
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
        new ApiResponse(200, updatedMessage, "message updated ssuccessfully"),
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

    if (message.author_id.toString() !== req.user._id)
      throw new ApiError(403, "only author can delete the messsage");
    await messageModel.findByIdAndDelete(message._id);

    return res
      .status(200)
      .json(new ApiResponse(200, null, "messsage deleted successfullly"));
  } catch (error) {
    next(error);
  }
};
