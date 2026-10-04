import express from "express";
import {
  getServerMembers,
  removeMember,
  updateMemberRoles,
} from "../controllers/serverMember.controller.js";
import { authMiddleware } from "../middlewares/authmiddleware.js";
import {
  removeMemberValidator,
  serverMemberValidator,
} from "../validators/serverMemberValidator.js";
import { validate } from "../middlewares/validatte.middleware.js";

const router = express.Router();

router.get(
  "/:serverId/members",
  authMiddleware,
  serverMemberValidator,
  validate,
  getServerMembers,
);
router.delete(
  "/:serverId/members/:userId",
  authMiddleware,
  removeMemberValidator,
  validate,
  removeMember,
);

router.patch(
  "/:serverId/members/:userId/roles",
  authMiddleware,
  removeMemberValidator,
  validate,
  updateMemberRoles,
);

export default router;
