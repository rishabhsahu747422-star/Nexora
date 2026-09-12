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
