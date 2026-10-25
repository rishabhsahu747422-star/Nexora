import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import userModel from "../models/user.model.js";
import { isTokenBlocklisted } from "../services/tokenBlocklist.service.js";

export const socketMiddleware = async (socket, next) => {
  try {
    let accessToken = null;
    const cookies = socket.handshake.headers.cookie;
    if (cookies) {
      accessToken = cookies
        .split(";")
        .map((c) => c.trim())
        .find((cookie) => cookie.startsWith("accessToken="))
        ?.split("=")[1];
    }

    if (!accessToken && socket.handshake.auth?.token) {
      accessToken = socket.handshake.auth.token;
    }

    if (!accessToken) {
      throw new ApiError(401, "Auth is required from socket middleware");
    }

    const isRevoked = await isTokenBlocklisted(accessToken, "accessToken");
    if (isRevoked) {
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
