import express from "express";
import { createRole } from "../controllers/role.controller.js";

const router = express.Router();

router.post("/:serverId.roles", createRole);

export default router;
