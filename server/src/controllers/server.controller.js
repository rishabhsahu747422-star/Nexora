import { log } from "console";
import mongoose from "mongoose";
import serverModel from "../models/server.model.js";
import userModel from "../models/user.model.js";
import sendFiles from "../services/storage.service.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { generateInviteCode } from "../utils/inviteCode.js";
import roleModel from "../models/role.model.js";
import channelModel from "../models/channel.model.js";
import { createServerMember } from "../services/serverMember.service.js";
import serverMemberModel from "../models/serverMember.model.js";

export const createServer = async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;
    if (!name) {
      throw new ApiError(400, "Name required for server creation");
    }

    const icon = req.files?.icon;
    const banner = req.files?.banner;

    let uploadIcon = null;
    if (icon) {
      uploadIcon = await sendFiles(icon[0].buffer, icon[0].originalname);
    }

    let uploadBanner = null;
    if (banner) {
      uploadBanner = await sendFiles(banner[0].buffer, banner[0].originalname);
    }

    const inviteCode = generateInviteCode();

    const server = await serverModel.create({
      name,
      description,
      email: req.user.id,
      icon: uploadIcon?.url || "",
      banner: uploadBanner?.url || "",
      isPublic,
      inviteCode,
    });

    const ownerRole = await roleModel.create({
      name: "Owner",
      server: server._id,
      permissions: [
        "MANAGE_SERVER",
        "MANAGE_CHANNELS",
        "MANAGE_MEMBERS",
        "MANAGE_MEMBERS",
        "MANAGE_MESSAGES",
      ],
      position: 100,
    });

    const memberRole = await roleModel.create({
      name: "member",
      server: server._id,
      permissions: [],
      position: 10,
    });

    const defaultChannels = await channelModel.create([
      {
        name: "#general-chat",
        type: "text",
        server: server._id,
        position: 1,
      },
      {
        name: "Voice",
        type: "voice",
        server: server._id,
        position: 2,
      },
    ]);

    const serverMember = await createServerMember(req.user.id, server._id, [
      ownerRole._id,
    ]);

    await userModel.findByIdAndUpdate(req.user._id, {
      $push: { server: server._id },
    });

    return res
      .status(201)
      .json(new ApiResponse(201, server, "Server created Succesfully"));
  } catch (error) {
    console.log(error.message);
    return res.status(500).json(new ApiError(500, "Internal server error"));
  }
};
export const deleteServer = async (req, res) => {
  try {
    const { serverId } = req.params;

    const server = await serverModel.findById(serverId);

    if (!server) {
      throw new ApiError(404, "Server does not exist");
    }

    const ownerId = server.email?.toString();
    const currentUserId = req.user._id?.toString() || req.user.id?.toString();

    if (ownerId !== currentUserId) {
      throw new ApiError(403, "Only server owner can delete server");
    }

    await serverModel.findByIdAndDelete(serverId);
    await serverMemberModel.deleteMany({ server: serverId });
    await channelModel.deleteMany({ server: serverId });
    await roleModel.deleteMany({ server: serverId });
    await userModel.updateMany({ server: serverId }, { $pull: { server: serverId } });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Server deleted successfully"));
  } catch (error) {
    console.log(error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};
export const getSingleServer = async (req, res) => {
  try {
    const { serverId } = req.params;

    const server = await serverModel.findById(serverId);

    if (!server) {
      throw new ApiError(400, "Server not Exist");
    }
    const member = await serverMemberModel.exists({
      server: server._id,
      user: req.user._id,
    });

    if (!member) throw new ApiError(403, "you are not a member of the server");

    return res
      .status(200)
      .json(new ApiResponse(200, server, "Server Fetched Succcessfully"));
  } catch (error) {
    console.log(error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};
export const updateServer = async (req, res) => {
  try {
    const { serverId } = req.params;
    const { name, description, isPublic } = req.body;

    const server = await serverModel.findById(serverId);
    if (!server) {
      throw new ApiError(404, "Server not found");
    }

    const ownerId = server.email?.toString();
    const currentUserId = req.user._id?.toString() || req.user.id?.toString();

    if (ownerId !== currentUserId) {
      throw new ApiError(403, "Only server owner can update server details");
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    if (req.files?.icon?.[0]) {
      const uploadIcon = await sendFiles(req.files.icon[0].buffer, req.files.icon[0].originalname);
      updateData.icon = uploadIcon?.url || "";
    }
    if (req.files?.banner?.[0]) {
      const uploadBanner = await sendFiles(req.files.banner[0].buffer, req.files.banner[0].originalname);
      updateData.banner = uploadBanner?.url || "";
    }

    const updatedServer = await serverModel.findByIdAndUpdate(
      serverId,
      updateData,
      { new: true },
    );

    return res
      .status(200)
      .json(new ApiResponse(200, updatedServer, "Server updated successfully"));
  } catch (error) {
    console.log(error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};
export const getAllServer = async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id).populate("server");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return res.status(200).json({
      success: true,
      message: "Servers fetched successfully",
      servers: user.server || [],
    });
  } catch (error) {
    console.log(error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};
export const getInviteDetails = async (req, res, next) => {
  try {
    const rawInviteCode = req.params.inviteCode;
    if (!rawInviteCode) {
      throw new ApiError(400, "Invite code is required");
    }

    const cleanCode = rawInviteCode.replace(/[/?#].*$/, "").trim();
    const isObjectId = mongoose.isValidObjectId(cleanCode);

    const server = await serverModel.findOne({
      $or: [
        { inviteCode: cleanCode },
        { inviteCode: cleanCode.toLowerCase() },
        { inviteCode: new RegExp(`^${cleanCode}$`, "i") },
        ...(isObjectId ? [{ _id: cleanCode }] : []),
      ],
    });

    if (!server) {
      throw new ApiError(404, "Invalid or expired invite code");
    }

    if (!server.inviteCode) {
      server.inviteCode = generateInviteCode();
      await server.save();
    }

    const memberCount = await serverMemberModel.countDocuments({
      server: server._id,
    });

    let isMember = false;
    if (req.user?._id) {
      isMember = await serverMemberModel.exists({
        server: server._id,
        user: req.user._id,
      });
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          _id: server._id,
          id: server._id,
          name: server.name,
          description: server.description,
          icon: server.icon,
          banner: server.banner,
          inviteCode: server.inviteCode,
          isPublic: server.isPublic,
          memberCount: memberCount || 1,
          isMember: Boolean(isMember),
        },
        "Invite details retrieved successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};

export const joinServer = async (req, res, next) => {
  try {
    const rawInviteCode = req.params.inviteCode;
    if (!rawInviteCode) {
      throw new ApiError(400, "Invite code is required");
    }

    const cleanCode = rawInviteCode.replace(/[/?#].*$/, "").trim();
    const isObjectId = mongoose.isValidObjectId(cleanCode);

    const server = await serverModel.findOne({
      $or: [
        { inviteCode: cleanCode },
        { inviteCode: cleanCode.toLowerCase() },
        { inviteCode: new RegExp(`^${cleanCode}$`, "i") },
        ...(isObjectId ? [{ _id: cleanCode }] : []),
      ],
    });

    if (!server) {
      throw new ApiError(404, "Invalid or expired invite code");
    }

    if (!server.inviteCode) {
      server.inviteCode = generateInviteCode();
      await server.save();
    }

    const user = await userModel.findById(req.user._id);

    if (!user) throw new ApiError(404, "User not found");

    const alreadyExists = await serverMemberModel.exists({
      user: req.user._id,
      server: server._id,
    });

    if (alreadyExists) {
      await userModel.findByIdAndUpdate(req.user._id, {
        $addToSet: { server: server._id },
      });
      return res.status(200).json(
        new ApiResponse(
          200,
          { ...server.toObject(), id: server._id, alreadyMember: true },
          "You are already a member of this community"
        )
      );
    }

    let memberRole = await roleModel.findOne({
      server: server._id,
      name: "member",
    });

    if (!memberRole) {
      memberRole = await roleModel.create({
        name: "member",
        server: server._id,
        permissions: [],
        position: 10,
      });
    }

    await createServerMember(req.user._id, server._id, [memberRole._id]);

    await userModel.findByIdAndUpdate(req.user._id, {
      $addToSet: { server: server._id },
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        { ...server.toObject(), id: server._id, alreadyMember: false },
        "Joined community successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};
export const leaveServer = async (req, res, next) => {
  try {
    const { serverId } = req.params;

    const server = await serverModel.findById(serverId);
    if (!server) {
      throw new ApiError(404, "Server not found");
    }

    if (server.email.toString() === req.user._id.toString()) {
      throw new ApiError(403, "Server owner cannot leave the server");
    }

    const member = await serverMemberModel.findOneAndDelete({
      server: server._id,
      user: req.user._id,
    });

    if (!member) {
      throw new ApiError(404, "You are not a member of this server");
    }

    await userModel.findByIdAndUpdate(req.user._id, {
      $pull: { server: server._id },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "User left successfully"));
  } catch (error) {
    console.log(error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};
export const createInvite = async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const { regenerate } = req.body || {};
    const server = await serverModel.findById(serverId);
    if (!server) {
      throw new ApiError(404, "Server not found");
    }

    const isMember = await serverMemberModel.exists({
      server: server._id,
      user: req.user._id,
    });
    if (!isMember) {
      throw new ApiError(403, "You are not a member of this server");
    }

    if (regenerate || !server.inviteCode) {
      server.inviteCode = generateInviteCode();
      await server.save();
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        { inviteCode: server.inviteCode },
        "Invite created successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};
