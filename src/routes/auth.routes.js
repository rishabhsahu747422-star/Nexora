import express from "express";
import upload from "../config/multer.config.js";
import {
  forgetPassword,
  googleAuth,
  login,
  logout,
  register,
  resetPassword,
  verifyOtp,
} from "../controllers/auth.controller.js";
import passport from "passport";
import {
  forgotPasswordValidator,
  loginValidator,
  registerValidator,
  resetPasswordValidator,
  verifyOtpValidator,
} from "../validators/auth.validator.js";
import { validate } from "../middlewares/validatte.middleware.js";

const router = express.Router();

router.post(
  "/register",
  upload.single("image"),
  registerValidator,
  validate,
  register,
);
router.post("/login", loginValidator, validate, login);

router.post(
  "google",
  passport.authenticate("google", { scope: ["Profile", "email"] }),
); //is line ka matlab samjhna h

router.post(
  "google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  googleAuth,
); //line samjh nhi aayi

router.post("/logout", logout);

router.post(
  "/forget-password",
  forgotPasswordValidator,
  validate,
  forgetPassword,
);
router.post("/verify-otp", verifyOtpValidator, validate, verifyOtp);

router.post("/reset-password", resetPasswordValidator, validate, resetPassword);

export default router;
