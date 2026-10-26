import { body, param, query } from "express-validator";

const objectId = (field) =>
  param(field).isMongoId().withMessage(`${field} must be a valid Id`);

export const updateProfileValidator = [
  body("username")
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("Username must be between 3 and 20 characters"),
  body("fullname")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Full name cannot be empty"),
  body("mobile_no")
    .optional()
    .isInt({ min: 1000000000, max: 999999999999 })
    .withMessage("Mobile number must be valid"),
  body("dob")
    .optional()
    .isISO8601()
    .withMessage("Date of birth must be a valid date"),
  body("bio")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Bio cannot exceed 300 characters"),
  body("customStatus")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Custom status cannot exceed 100 characters"),
  body("appearance")
    .optional()
    .isObject()
    .withMessage("Appearance must be an object"),
  body("appearance.theme")
    .optional()
    .isIn(["dark", "light", "system"])
    .withMessage("Invalid theme"),
  body("appearance.accentColor")
    .optional()
    .matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
    .withMessage("Invalid accent color HEX"),
  body("appearance.accentName")
    .optional()
    .isString()
    .isLength({ max: 50 })
    .withMessage("Invalid accent name"),
  body("appearance.surfaceStyle")
    .optional()
    .isIn(["midnight", "graphite", "oled"])
    .withMessage("Invalid surface style"),
  body("appearance.messageSpacing")
    .optional()
    .isIn(["compact", "comfortable"])
    .withMessage("Invalid message spacing"),
];

export const usernameValidator = [
  param("username")
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("Username must be between 3 and 20 characters"),
];

export const searchUserValidator = [
  query("query")
    .trim()
    .notEmpty()
    .withMessage("Search query is required")
    .isLength({ max: 50 })
    .withMessage("Search query is too long"),
];

export const changePasswordValidator = [
  body("password")
    .isString()
    .isLength({ min: 6 })
    .withMessage("Current password must be at least 6 characters"),
  body("newPassword")
    .isString()
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),
];

export const userIdValidator = [objectId("userId")];
