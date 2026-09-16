import express from "express";
import { authMiddleware } from "../middlewares/authmiddleware.js";
import {
  changePassword,
  getUserProfile,
  searchUser,
  updateProfile,
  updateProfilePicture,
} from "../controllers/user.controller.js";
import upload from "../config/multer.config.js";

const router = express.Router();

router.use(authMiddleware);
router.get("/me", getMe);
router.patch("/me", updateProfile);
router.patch("/me/password", changePassword);
router.patch(
  "/me/profile-picture",
  upload.single("image"),
  updateProfilePicture,
);
router.get("/search", searchUser);
router.get("/:username", getUserProfile);

export default router;
