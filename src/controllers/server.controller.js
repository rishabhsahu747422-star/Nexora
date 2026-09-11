import { log } from "console";
import serverModel from "../models/server.model.js";
import userModel from "../models/user.model.js";
import sendFiles from "../services/storage.service.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { generateInviteCode } from "../utils/inviteCode.js";

export const createServer = async (req, res) => {
  try {
    const { name, email, description, isPublic } = req.body;
    if (!name) {
      throw new ApiError(400, "Name required for server creation");
    }

    const icon = req.files.icon;
    const banner = req.files.banner;

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
      email,
      icon: uploadIcon?.url || "",
      banner: uploadBanner?.url || "",
      isPublic,
      inviteCode,
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

    const server = serverModel.findOne({ serverId });

    if (!server) {
      throw new ApiError(400, "Server not Exists");
    }

    await serverModel.findByIdAndDelete({ serverId });

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

    return res
      .status(200)
      .json(new ApiResponse(200, server, "Server Fetched Succcessfully"));
  } catch (error) {
    console.log(error.message);
  }
};
export const updateServer = async (req, res) => {
  try {
    const { _id } = req.params;
    const { name, description, isPublic } = req.body;
    const icon = req.files.icon[0];
    const banner = req.files.banner[0];

    const server = await serverModel.findByIdAndUpdate(
      _id,
      { name, description, isPublic, icon, banner },
      { new: true },
    );

    if (!server) {
      throw new ApiError(400, "Server not found");
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
    const { inviteCode } = req.params;

    const server = await serverModel.findOne({ inviteCode });

    if (!inviteCode) {
      throw new ApiError(404, "Invalid Invite Code");
    }

    const user = await userModel.findById(req.user.id);

    const alreadyExists = user.server.some((serverId) => {
     serverId.toString() === server._id.toString();
    });

    if (!alreadyExists) {
      throw new ApiError(400, "Already Member");
    }

    user.server.push(server._id);
    await user.save();
    return res
      .status(200)
      .json(new ApiResponse(200, server, "server join successfully"));
  } catch (error) {
    console.log(error.message);
  }
};
export const leaveServer = async (req, res) => {
  try {
    const { id } = req.params;

    const user = userModel.findByIdAndUpdate(
      req.user._id,
      { $pull: { server: id } },
      { new: true },
    );
    if (!user) {
      throw new ApiError(400, "User not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, server, "User left successfully"));
  } catch (error) {
    console.log(error.message);
  }
};
