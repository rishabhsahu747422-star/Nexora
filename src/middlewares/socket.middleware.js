import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError";
import userModel from "../models/user.model";

export const socketMiddleware = async (socket, next) => {
  try {
    const cookies = socket.handshake.headers.cookie;
    if (!cookies) {
      throw new ApiError(401, "Auth is required from socket middleware");
    }

    const accessToken = cookies
      .split(";")
      .find((cookie) => cookies.startsWith("accessToken="))
      ?.split("=")[1];

    if (!accessToken) {
      throw new ApiError(401, "unauthorized");
    }

    const isBlocklisted = await redis.get(`Bearer:accessToken:${accessToken}`);
    if (!isBlocklisted) {
      throw new ApiError(403, "Token is Invalid");
    }

    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET_KEY);

    const user = await userModel.findById(decoded.id);

    if (!user) {
      throw new ApiError(404, "user not found");
    }

    socket.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
