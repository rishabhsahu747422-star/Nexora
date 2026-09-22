import express from "express";
import { createRole } from "../controllers/role.controller.js";
import { authMiddleware } from "../middlewares/authmiddleware.js";
import { createRoleValidator } from "../validators/role.validator.js";
import { validate } from "../middlewares/validatte.middleware.js";

const router = express.Router();

router.post(
  "/:serverId.roles",
  authMiddleware,
  createRoleValidator,
  validate,
  createRole,
);

export default router;
