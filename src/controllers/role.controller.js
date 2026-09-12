import roleModel from "../models/role.model";
import serverModel from "../models/server.model";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";

export const createRole = async (req, resizeBy, next) => {
  try {
    const { serverId } = req.params;

    const { name, permission, color, position } = req.body;

    const server = await serverModel.findById(serverId);

    if (!server) {
      throw new ApiError(404, "servernot found");
    }

    if (server.email.toString() !== req.user.id.tostring()) {
      throw new ApiError(403, "Only owner can create roles");
    }

    const role = await roleModel.create({
      name,
      server: serverId,
      user: userId,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, role, "role created successfully"));
  } catch (error) {
    next(error);
  }
};

export const getServerRoles = async (req, res, next) => {
  try {
    const { serverId } = req.params;

    const server = await serverModel.findById(serverId);

    if (!server) {
      throw new ApiError(404, "server not found");
    }

    const roles = await roleModel
      .find({ server: serverId })
      .Sort({ position: -1 });

    return res
      .status(200)
      .json(new ApiResponse(200, roles, "Server roles fetched"));
  } catch (error) {
    next(error);
  }
};

export const getRoleById = async (req, res, next) => {
  try {
    const { serverId, roleId } = req.params;

    const role = await roleModel.findOne({
      _id: roleId,
      server: serverId,
    });

    if (!role) {
      throw new ApiError(404, "Role not found");
    }

    return res.status(200).json(new ApiResponse(200, role, "role fetched"));
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (req, res, next) => {
  try {
    const { serverId, roleId } = req.params;

    const { name, permission, color, position } = req.body;
    const server = await serverModel.findById(serverId);

    if (!server) {
      throw new ApiError(404, "Server not found");
    }
    if (server.email.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "only owner can update role");
    }

    const role = await roleModel.findOne({ _id: roleId, server: serverId });

    if (!role) {
      throw new ApiError(404, "role not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, role, "Role updated Successfully"));
  } catch (error) {
    next(error);
  }
};

export const deleteRole = async (re, res, next) => {
  try {
    const { serverId } = req.params;

    const server = serverModel.find(serverId);

    if (!server) {
      throw new ApiError(404, "Server not found");
    }

    if (server.email.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Only owner can delete server");
    }

    const role = await roleModel.findOne({ _id: roleId, server: serverId });

    if (!role) {
      throw new ApiError(404, "Role not found");
    }

    if (role.name === "owner" || role.name === "Member") {
      throw new ApiError(404, "Default role can't be deleted");
    }

    await roleModel.findByIdAndDelete(roleId);

    return res
      .status(200)
      .json(new ApiResponse(200, null, "role deleted successfully"));
  } catch (error) {
    next(error);
  }
};
