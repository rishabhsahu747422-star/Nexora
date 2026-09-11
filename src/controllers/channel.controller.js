import channelModel from "../models/channel.model.js";
import serverModel from "../models/server.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const createChannel = async (req, res, next) => {
  try {
    const { serverID } = req.params;
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
