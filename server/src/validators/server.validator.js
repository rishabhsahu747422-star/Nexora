import { body, param } from "express-validator";

export const serverIdValidator = [
  param("serverId").isMongoId().withMessage("serverID is not valid"),
];

export const createServerValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("server name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("server name must between 2 and 100 chars"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("isPublic")
    .optional()
    .isBoolean()
    .withMessage("isPublic must be boolean")
    .toBoolean(),
];

export const inviteCodeValidator = [
  param("inviteCode")
    .trim()
    .notEmpty()
    .withMessage("Invite code is required")
    .isLength({ max: 100 })
    .withMessage("Invite code is invalid"),
];
