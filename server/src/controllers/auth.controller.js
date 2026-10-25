import redis from "../config/redis.js";
import userModel from "../models/user.model.js";
import sendEmail from "../services/email.service.js";
import sendFiles from "../services/storage.service.js";
import { generateOtp } from "../utils/otp.js";
import { generateToken } from "../utils/token.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const register = async (req, res, next) => {
  try {
    const { username, email, password, dob, fullname, mobile_no } = req.body;

    const file = req.file;

    if (!fullname || !username || !email || !password)
      return res.status(400).json({
        success: false,
        message: "All fields are Required",
      });

    let uploadImage = null;

    if (file) {
      uploadImage = await sendFiles(file.buffer, file.originalname);
    }

    const user = await userModel.create({
      username,
      email,
      password,
      dob,
      fullname,
      mobile_no,
      profile_pic: uploadImage?.url,
    });

    const accessToken = await generateToken(user._id, "10min");
    const refreshToken = await generateToken(user._id, "1d");

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      maxAge: 10 * 60 * 1000,
      secure: true,
      sameSite: "strict",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      secure: true,
      sameSite: "strict",
    });

    const userData = user.toObject();
    delete userData.password;

    return res.status(201).json({
      success: true,
      message: "User Registered ",
      user: userData,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({
        success: false,
        message: "All field are Required",
      });

    const user = await userModel.findOne({ email });

    if (!user)
      return res.status(400).json({
        success: false,
        message: "user not found",
      });

    if (!user.password || user.authProvider === "google")
      return res.status(400).json({
        success: false,
        message: "Continue with Google",
      });

    const isCorrectPassword = user.comparePass(password);

    if (!isCorrectPassword)
      return res.status(400).json({
        success: false,
        message: "Invalid Credentials",
      });

    const accessToken = generateToken(user._id, "10min");
    const refreshToken = generateToken(user._id, "1d");

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      maxAge: 10 * 60 * 1000,
      secure: true,
      sameSite: "strict",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      secure: true,
      sameSite: "strict",
    });

    const userData = user.toObject();
    delete userData.password;

    return res.status(200).json({
      success: true,
      message: "User LoggedIn Successfully",
      user: userData,
    });
  } catch (error) {
    next(error);
  }
};

export const googleAuth = async (req, res, next) => {
  try {
    const { email, name, given_name, picture, sub } = req.user._json;
    const user = await userModel.findOne({ email });

    if (user) {
      if (!user.googleId) {
        user.googleId = sub;
        await user.save();
      }

      const accessToken = await generateToken(user._id, "10min");
      const refreshToken = await generateToken(user._id, "1d");

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        maxAge: 15 * 60 * 1000,
        sameSite: "strict",
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: "strict",
      });

      const clientUrl = process.env.CLIENT_URL || "https://nexora-umber-nine.vercel.app";
      return res.redirect(`${clientUrl}/app`);
    }

    const newUser = await userModel.create({
      username: given_name || name?.replace(/\s+/g, "_").toLowerCase(),
      fullname: name,
      email,
      mobile_no: "0000000000",
      profile_pic: picture,
      googleId: sub,
      authProvider: req.user.provider || "google",
    });

    const accessToken = await generateToken(newUser._id, "10min");
    const refreshToken = await generateToken(newUser._id, "1d");

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000,
      sameSite: "strict",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "strict",
    });

    const clientUrl = process.env.CLIENT_URL || "https://nexora-umber-nine.vercel.app";
    return res.redirect(`${clientUrl}/app`);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    try {
      if (redis.status === "ready") {
        if (accessToken) {
          await redis.set(`Bearer:accessToken:${accessToken}`, "true", "EX", 3600);
        }
        if (refreshToken) {
          await redis.set(`Bearer:refreshToken:${refreshToken}`, "true", "EX", 86400);
        }
      }
    } catch (redisErr) {
      console.warn("Redis blocklist on logout skipped:", redisErr.message);
    }

    res.clearCookie("refreshToken");
    res.clearCookie("accessToken");

    return res.status(200).json({
      success: true,
      message: "User logout successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const forgetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({
        success: false,
        message: "Email is Required",
      });

    const user = await userModel.findOne({ email });

    if (!user)
      return res.status(400).json({
        success: false,
        message: "User not found",
      });

    const otp = generateOtp();

    const hashedOtp = bcrypt.hashSync(otp, 10);

    await redis.set(`hashedOtp_reset_pass_${email}`, hashedOtp, "EX", 10 * 60);

    await sendEmail(
      user.email,
      "Reset your Discord Password",
      `Reset your password using this OTP :${otp}`,

      `<div style="font-family: Arial, sans-serif;">
                <h2>Password Reset Request</h2>

                <p>Your OTP for resetting your password is:</p>

                <h1 style="letter-spacing: 5px;">
                    ${otp}
                </h1>

                <p>This OTP will expire in <strong>10 minutes</strong>.</p>

                <p>If you did not request a password reset, please ignore this email.</p>
            </div>`,
    );

    return res.status(200).json({
      success: true,
      message: "Email sent Successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!otp)
      return res.status(400).json({
        success: false,
        message: "OTP is Required",
      });

    const hashedOtp = await redis.get(`hashedOtp_reset_pass_${email}`);

    if (!hashedOtp)
      return res.status(400).json({
        success: false,
        message: "OTP is Expired ",
      });

    const isValid = bcrypt.compareSync(otp, hashedOtp);

    if (!isValid)
      return res.status(400).json({
        success: true,
        message: "Invalid OTP",
      });

    await redis.del(`hashedOtp_reset_pass_${email}`);

    const resetToken = generateToken(email, "10min");

    const hashedResetToken = bcrypt.hashSync(resetToken, 10);

    await redis.set(
      `hashed_reset_token_${email}`,
      hashedResetToken,
      "EX",
      10 * 60,
    );

    return res.status(200).json({
      success: true,
      message: "OTP verified Successfully",
      resetToken,
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword)
      return res.status(400).json({
        success: false,
        message: "Don't accept Empty Fields",
      });

    const hashedResetToken = await redis.get(`hashed_reset_token_${email}`);

    if (!hashedResetToken)
      return res.status(400).json({
        success: false,
        message: "Session Timeout please try again",
      });

    const user = await userModel.findOne({ email }).select("password");

    if (!user)
      return res.status(400).json({
        success: false,
        message: "User not found",
      });

    user.password = newPassword;
    await user.save();

    await redis.del(`hashed_reset_token_${email}`);

    return res.status(200).json({
      success: true,
      message: "Password changed ",
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "unauthorized",
    });
  }

  let isBlacklisted = null;
  try {
    if (redis.status === "ready") {
      isBlacklisted = await redis.get(`Bearer:refreshToken:${refreshToken}`);
    }
  } catch (redisErr) {
    console.warn("Redis refreshToken blocklist check skipped:", redisErr.message);
  }

  if (isBlacklisted) {
    return res.status(401).json({
      success: false,
      message: "Refresh Token has been revoked",
    });
  }

  try {
    const secret = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY;
    const decoded = jwt.verify(refreshToken, secret);
    const user = await userModel.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "user not found",
      });
    }

    const accessToken = generateToken(user._id, "10m");

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000,
      secure: false,
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message: "Access token regenerated successfully",
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
};
