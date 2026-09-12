import express from "express";
import {
  getServerMembers,
  removeMember,
} from "../controllers/serverMember.controller.js";
const router = express.Router();
router.get("/:serverId/members", getServerMembers);
router.delete("/:serverId/members/:userId", removeMember);
export default router;
