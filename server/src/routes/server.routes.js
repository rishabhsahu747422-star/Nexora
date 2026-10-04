import express from "express";
import {
  createInvite,
  createServer,
  deleteServer,
  getAllServer,
  joinServer,
  leaveServer,
  updateServer,
} from "../controllers/server.controller.js";
import upload from "../config/multer.config.js";
import { authMiddleware } from "../middlewares/authmiddleware.js";
import {
  createServerValidator,
  inviteCodeValidator,
} from "../validators/server.validator.js";
import { validate } from "../middlewares/validatte.middleware.js";
import { getServer } from "../../../Client/src/services/server.service.js";

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

router.get("/", authMiddleware, getAllServer);
// router.post("/",authMiddleware,upload.fields([{name:"icon",maxCount:1},{name:"banner",maxCount:1}]),createServer)
router.get("/:serverId", authMiddleware, getServer);
router.patch("/:serverId", authMiddleware, updateServer);
router.delete("/:serverId", authMiddleware, deleteServer);
router.post("/:serverId/invite", authMiddleware, createInvite);
router.delete("/:serverId/leave", authMiddleware, leaveServer);

export default router;
