import channelModel from "../models/channel.model.js";
import serverModel from "../models/server.model.js";
import serverMemberModel from "../models/serverMember.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const requireMember = async (serverId, userId) => {
  const member = await serverMemberModel.exists({
    server: serverId,
    user: userId,
  });
  if (!member) throw new ApiError(403, "you are not member of this server");
};

export const createChannel = async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const { name, type, position, isPrivate } = req.body;

    const server = await serverModel.findById(serverId);

    if (!server) {
      throw new ApiError(404, "Server not Found");
    }

    if (server.email.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Only server owner can create channels");
    }

    const channel = await channelModel.create({
      name,
      type,
      server: serverId,
      position,
      isPrivate,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, channel, "channel created Successfully"));
  } catch (error) {
    next(error);
    console.log(error.message);
  }
};

export const getServerChannels = async (req, res, next) => {
  try {
    await requireMember(req.params.serverId, req.user._id);

    const channels = await channelModel
      .find({ server: req.params.serverId })
      .sort({
        position: 1,
        createdAt: 1,
      });

    return res
      .status(200)
      .json(new ApiResponse(200, channels, "Channels fetched successfully"));
  } catch (error) {
    next(error);
  }
};

export const getChannelById = async (req, res, next) => {
  try {
    const channel = await channelModel.findOne({
      _id: req.params.channelId,
      server: req.params.serverId,
    });
    if (!channel) throw new ApiError(404, "channel not found");
    await requireMember(channel.server, req.user._id);
    return res
      .status(200)
      .json(new ApiResponse(200, channel, "channel fetched successfully"));
  } catch (error) {
    next(error);
  }
};

export const updateChannel = async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const server = await serverModel.findById(serverId);

    if (!server) throw new ApiError(404, "server not found");

    if (!server.email.toString() !== req.user._id.toString())
      throw new ApiError(403, "only owner of the server can update channel");
  } catch (error) {
    next(error);
  }
};

export const deleteChannel = async (req, res, next) => {
  try {
    const { serverId, channelId } = req.params;
    const server = await serverModel.findById(serverId);
    if (!server) throw new ApiError(404, "server not found");

    const channel = await channelModel.findOneAndDelete({
      _id: channelId,
      server: serverId,
    });
    if (!channel) throw new ApiError(404, "channel not found");

    return res
      .status(200)
      .json(new ApiResponse(200, null, "channel deleted successfully"));
  } catch (error) {
    next(error);
  }
};
