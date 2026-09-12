import express from "express";
import { createServer, joinServer } from "../controllers/server.controller.js";
import upload from "../config/multer.config.js";

const router = express.Router();

router.post(
  "/create",
  upload.fields([
    { name: "icon", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  createServer,
);

router.post("/join/:inviteCode", joinServer);

export default router;
