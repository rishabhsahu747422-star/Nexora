import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import userModel from "../models/user.model.js";
import redis from "../config/redis.js";

export const socketMiddleware = async (socket, next) => {
  try {
    const cookies = socket.handshake.headers.cookie;
    if (!cookies) {
      throw new ApiError(401, "Auth is required from socket middleware");
    }

    const accessToken = cookies
      .split(";")
      .map((c) => c.trim())
      .find((cookie) => cookie.startsWith("accessToken="))
      ?.split("=")[1];

    if (!accessToken) {
      throw new ApiError(401, "unauthorized");
    }

    let isBlocklisted = null;
    try {
      if (redis.status === "ready") {
        isBlocklisted = await redis.get(`Bearer:accessToken:${accessToken}`);
      }
    } catch (err) {
      console.warn("Redis socket blocklist check skipped:", err.message);
    }
    if (isBlocklisted) {
      throw new ApiError(403, "Token is Invalid or Revoked");
    }

    const secret = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY;
    const decoded = jwt.verify(accessToken, secret);

    const user = await userModel.findById(decoded.id).select("-password");

    if (!user) {
      throw new ApiError(404, "user not found");
    }

    socket.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
