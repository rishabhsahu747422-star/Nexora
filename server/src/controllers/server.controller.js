import { log } from "console";
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
      { name: "#general-chat", server: server._id, position: 1 },
      {
        name: "announcement",
        server: server._id,
        position: 2,
      },
    ]);

    const serverMember = await createServerMember(req.user.id, server._id, [
      ownerRole._id,
    ]);
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

    const server = serverModel.findOne({ serverId });

    if (!server) {
      throw new ApiError(400, "Server not Exists");
    }

    await serverModel.findByIdAndDelete({ serverId });
    await serverMemberModel.deleteMany({ server: server._id });
    await channelModel.deleteMany({ server: server._id });
    await roleModel.deleteMany({ server: server._id });

    return res
      .status(200)
      .json(new ApiResponse(200, "Server Deleted successfully"));
  } catch (error) {
    console.log(error.message);
  }
};
export const getSingleServer = async (req, res) => {
  try {
    const { serverId } = req.params;

    const server = await serverModel.findById({ serverId });

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
  }
};
export const updateServer = async (req, res) => {
  try {
    const { serverId } = req.params;
    const { name, description, isPublic } = req.body;
    const icon = req.files.icon[0];
    const banner = req.files.banner[0];

    const server = await serverModel.findByIdAndUpdate(
      serverId,
      { name, description, isPublic, icon, banner },
      { new: true },
    );

    if (!server) {
      throw new ApiError(400, "Server not found");
    }

    if (server.email.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "only server owner can update server details");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, server, "Server updated Successfully"));
  } catch (error) {
    console.log(error.message);
  }
};
export const getAllServer = async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id).populate("server");

    if (!user || user.server.length === 0) {
      throw new ApiError(400, "User not joined to any server");
    }

    return res.status(200).json({
      success: true,
      message: "Servers fetched successfully",
      servers: user.server,
    });
  } catch (error) {
    console.log(error.message);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};
export const joinServer = async (req, res) => {
  try {
    const inviteCode = req.params.inviteCode.trim();

    const server = await serverModel.findOne({ inviteCode });

    if (!server) {
      throw new ApiError(404, "Invalid Invite Code");
    }

    const user = await userModel.findById(req.user.id);

    if (!user) throw new ApiError(404, "User not found");

    // const alreadyExists = user.server.some((serverId) => {
    //   serverId.toString() === server._id.toString();
    // });

    const alreadyExists = await serverMemberModel.exists({
      user: req.user._id,
      server: server._id,
    });

    if (!alreadyExists) {
      throw new ApiError(400, "Already Member");
    }
    const memberRole = await roleModel.findOne({
      server: server._id,
      name: "member",
    });

    await createServerMember(req.user._id, server._id, [memberRole._id]);

    return res
      .status(200)
      .json(new ApiResponse(200, server, "server join successfully"));
  } catch (error) {
    console.log(error.message);
  }
};
export const leaveServer = async (req, res) => {
  try {
    const { serverId } = req.params;

    const server = serverModel.findById(serverId);
    if (!server) {
      throw new ApiError(400, "server not found");
    }

    if (server.email.toString() === req.user.if.toString()) {
      throw new ApiError(403, "only server owner can't leave the server");
    }

    const member = await serverMemberModel.findByIdAndDelete({
      server: server._id,
      user: req.user._id,
    });

    if (!member) {
      throw new ApiError(404, "you are not the menber of server");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, null, "User left successfully"));
  } catch (error) {
    console.log(error.message);
  }
};
export const createInvite = async (req, res) => {
  try {
    const { serverId } = req.params;
    const server = await serverModel.findById(serverId);
    if (!server) {
      throw new ApiError(404, "server not found");
    }

    if (
      !(await serverMemberModel.exists({
        server: server._id,
        user: req.user._id,
      }))
    ) {
      throw new ApiError(403, "you are not a member of this server");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { inviteCode: server.inviteCode },
          "Invite creaated successfully",
        ),
      );
  } catch (error) {
    console.log(error.message);
  }
};
