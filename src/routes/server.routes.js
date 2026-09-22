import express from "express";
import { createServer, joinServer } from "../controllers/server.controller.js";
import upload from "../config/multer.config.js";
import { authMiddleware } from "../middlewares/authmiddleware.js";
import {
  createServerValidator,
  inviteCodeValidator,
} from "../validators/server.validator.js";
import { validate } from "../middlewares/validatte.middleware.js";

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  upload.fields([
    { name: "icon", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  createServerValidator,
  validate,
  createServer,
);

router.post(
  "/join/:inviteCode",
  authMiddleware,
  inviteCodeValidator,
  validate,
  joinServer,
);

export default router;
