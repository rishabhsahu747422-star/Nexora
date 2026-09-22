import { body, param, query } from "express-validator";

const objectId = (field) =>
  param(field).isMongoId().withmessage(`${field} must be a valid Id`);

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
