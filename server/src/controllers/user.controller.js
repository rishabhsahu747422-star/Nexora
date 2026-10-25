import userModel from "../models/user.model.js";
import sendFiles from "../services/storage.service.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

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
    const { username, fullname, mobile_no, bio, customStatus } = req.body;
    const updateData = {};

    if (username !== undefined) updateData.username = username;
    if (fullname !== undefined) updateData.fullname = fullname;
    if (mobile_no !== undefined) updateData.mobile_no = mobile_no;
    if (bio !== undefined) updateData.bio = bio;
    if (customStatus !== undefined) updateData.customStatus = customStatus;

    const targetUserId = req.user?.id || req.user?._id;
    const updatedUser = await userModel
      .findByIdAndUpdate(targetUserId, updateData, {
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

export const getUserProfile = async (req, res, next) => {
  try {
    const user = await userModel
      .findOne({ username: req.params.username })
      .select("-password");
    if (!user) throw new ApiError(404, "User not found");

    return res
      .status(200)
      .json(new ApiResponse(200, user, "User fetched successfully"));
  } catch (error) {
    next(error);
  }
};

export const searchUser = async (req, res, next) => {
  try {
    const query = req.query.query || req.query.q || req.query.search || req.query.username || "";
    const currentUserId = req.user._id || req.user.id;

    const users = await userModel
      .find({
        _id: { $ne: currentUserId },
        $or: [
          { username: { $regex: query, $options: "i" } },
          { fullname: { $regex: query, $options: "i" } },
        ],
      })
      .select("username fullname profile_pic");

    return res
      .status(200)
      .json(new ApiResponse(200, users, "users fetched"));
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { password, newPassword } = req.body;
    if (password === newPassword) {
      throw new ApiError(409, "new password cannot be same as old password");
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
    return res.status(200).json(new ApiResponse(200, null, "Password updated successfully"));
  } catch (error) {
    next(error);
  }
};

export const updateProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, "Profile image required");
    }
    const user = await userModel.findById(req.user.id);
    if (!user) {
      throw new ApiError(404, "user not found");
    }

    const uploadFile = await sendFiles(req.file.buffer, req.file.originalname);
    user.profile_pic = uploadFile.url;
    await user.save();

    return res
      .status(200)
      .json(new ApiResponse(200, { profile_pic: user.profile_pic }, "Profile picture updated successfully"));
  } catch (error) {
    next(error);
  }
};
