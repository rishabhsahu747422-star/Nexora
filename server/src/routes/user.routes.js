import express from "express";
import { authMiddleware } from "../middlewares/authmiddleware.js";
import {
  changePassword,
  getMe,
  getUserProfile,
  searchUser,
  updateProfile,
  updateProfilePicture,
} from "../controllers/user.controller.js";
import upload from "../config/multer.config.js";
import {
  changePasswordValidator,
  searchUserValidator,
  updateProfileValidator,
  usernameValidator,
} from "../validators/user.validator.js";
import { validate } from "../middlewares/validatte.middleware.js";

const router = express.Router();

router.use(authMiddleware);
router.get("/me", getMe);
router.patch("/me", updateProfileValidator, validate, updateProfile);
router.patch("/me/password", changePasswordValidator, validate, changePassword);
router.patch(
  "/me/profile-picture",
  upload.single("image"),
  updateProfilePicture,
);
router.get("/search", searchUserValidator, validate, searchUser);
router.get("/:username", usernameValidator, validate, getUserProfile);

export default router;
