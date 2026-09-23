import dotenv from "dotenv";
dotenv.config();

import ApiError from "../utils/ApiError.js";
import redis from "../config/redis.js";
import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      throw new ApiError(401, "Access token not found from auth middleware");
    }

    const isTokenBlacklisted = await redis.get(`Bearer:accessToken:${token}`);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

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
