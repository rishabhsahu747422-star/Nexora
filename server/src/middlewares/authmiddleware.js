import dotenv from "dotenv";
dotenv.config();

import ApiError from "../utils/ApiError.js";
import { isTokenBlocklisted } from "../services/tokenBlocklist.service.js";
import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const token =
      req.cookies.accessToken ||
      req.headers.authorization?.replace(/^Bearer\s+/i, "");

    if (!token) {
      throw new ApiError(401, "Access token not found from auth middleware");
    }

    const revoked = await isTokenBlocklisted(token, "accessToken");
    if (revoked) {
      throw new ApiError(401, "Token has been revoked");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.JWT_SECRET_KEY);

    const user = await userModel.findById(decoded.id).select("-password");

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};
