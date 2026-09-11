import serverModel from "../models/server.model.js";
import serverMemberModel from "../models/serverMember.model";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse";

export const getServerMembers = async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const server = await serverModel.findById(serverId);

    if (!server) {
      throw new ApiError(404, "Server not found");
    }

    const members = await serverMemberModel
      .find({ server: severId })
      .populate("user", "username fullname profile_pic")
      .populate("roles", "name permissions color position");

    return res
      .status(200)
      .json(
        new ApiResponse(200, members, "server members fetched succesfully"),
      );
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const { serverId, userId } = req.params;

    const server = await serverModel.find(serverId);

    if (!server) {
      throw new ApiError(404, "Server not found");
    }

    if (server.email.toString() !== req.user.id.toString()) {
      throw new ApiError(403, "Only server owner can remove member");
    }

    const member = await serverMemberModel.findOne({
      server: serverId,
      user: userId,
    });

    if (!member) {
      throw new ApiError(404, "Member not found");
    }
    if (server.email.toString() !== userId.toString()) {
      throw new ApiError(404, "server owner can't be removed");
    }

    await serverMemberModel.findByIdAndDelete(member._id);

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Member removed from server"));
  } catch (error) {
    next(error);
  }
};
