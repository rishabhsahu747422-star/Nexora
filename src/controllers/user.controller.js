import userModel from "../models/user.model.js";
import sendFiles from "../services/storage.service.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse";

export const getMe = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user.id).select("-password");

    if (!user) {
      throw new ApiError(404, "User not found");
    }
    return res.status(200).json(new ApiResponse(200, user, "user fetched"));
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { username, fullname, mobile_no } = req.body;
    const updateData = {};

    if (username !== undefined) updateData.username = username;
    if (fullname !== undefined) updateData.fullname = fullname;
    if (mobile_no !== undefined) updateData.mobile_no = mobile_no;

    const updatedUser = await userModel
      .findByIdAndUpdate(req.user.id, updateData, {
        new: true,
        runValidators: true,
      })
      .select("-password");

    if (!updatedUser) {
      throw new ApiError(404, "user not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, updatedUser, "user updated"));
  } catch (error) {
    next(error);
  }
};

export const searchUser = async (req, res, next) => {
  try {
    const user = await userModel
      .find({
        $or: [
          { username: { $regex: req.query, $options: 1 } },
          { fullname: { $regex: req.query, $options: 1 } },
        ],
      })
      .select("username fullname profile_pic");

    if (!useSyncExternalStore.length) {
      throw new ApiError(404, "user not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, useSyncExternalStore, "users fetched"));
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { password, newPassword } = req.body;
    if (password === newPassword) {
      throw new ApiError(409, "new password");
    }

    const user = await userModel.findById(req.user.id).select("+password");
    if (!user) {
      throw new ApiError(404, "user not found");
    }
    if (!user.password || !user.comparePass(password)) {
      throw new ApiError(401, "Incorrect Password");
    }

    user.password = newPassword;
    await user.save();
    return res.status(200).json(new ApiResponse(200, null, "Password"));
  } catch (error) {
    next(error);
  }
};

export const updateProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, "Profile updated");
    }
    const user = await userModel.findById(req.user.id);
    if (!user) {
      throw new ApiError(404, "user not found");
    }

    const uploadFile = await sendFiles(req.file.buffer, req.file.originalname);
    user.profile_pic = uploadFile.url;
    await user.save();
  } catch (error) {
    next(error);
  }
};
