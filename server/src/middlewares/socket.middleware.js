import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import userModel from "../models/user.model.js";
import { isTokenBlocklisted } from "../services/tokenBlocklist.service.js";

export const socketMiddleware = async (socket, next) => {
  try {
    let accessToken = null;
    let refreshToken = null;
    const cookies = socket.handshake.headers.cookie;
    if (cookies) {
      const cookieList = cookies.split(";").map((c) => c.trim());
      accessToken = cookieList
        .find((cookie) => cookie.startsWith("accessToken="))
        ?.split("=")[1];
      refreshToken = cookieList
        .find((cookie) => cookie.startsWith("refreshToken="))
        ?.split("=")[1];
    }

    if (!accessToken && socket.handshake.auth?.token) {
      accessToken = socket.handshake.auth.token;
    }

    const secret = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY;

    // 1. Try verifying accessToken first
    if (accessToken) {
      try {
        const isRevoked = await isTokenBlocklisted(accessToken, "accessToken");
        if (!isRevoked) {
          const decoded = jwt.verify(accessToken, secret);
          const user = await userModel.findById(decoded.id).select("-password");
          if (user) {
            socket.user = user;
            return next();
          }
        }
      } catch (err) {
        // Access token expired, attempt fallback to refreshToken below if available
      }
    }

    // 2. Fallback: If accessToken is expired/missing, check refreshToken
    if (refreshToken) {
      const isRefreshRevoked = await isTokenBlocklisted(refreshToken, "refreshToken");
      if (!isRefreshRevoked) {
        try {
          const decodedRefresh = jwt.verify(refreshToken, secret);
          const user = await userModel.findById(decodedRefresh.id).select("-password");
          if (user) {
            socket.user = user;
            return next();
          }
        } catch (refreshErr) {
          // Both tokens invalid or expired
        }
      }
    }

    throw new ApiError(401, "Authentication required for socket connection");
  } catch (error) {
    next(error);
  }
};
