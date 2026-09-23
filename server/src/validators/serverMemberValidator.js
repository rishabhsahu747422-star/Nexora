import { param } from "express-validator";

const id = (field) =>
  param(field).isMongoId().withMessage(`${field} must be a valid id`);

export const serverMemberValidator = [id("serverId")];
export const removeMemberValidator = [id("serverId"), id("userId")];
