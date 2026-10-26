import { body, param, query } from "express-validator";

export const sendRequestValidator = [
  body().custom((value, { req }) => {
    if (!req.body.recipientId && !req.body.username) {
      throw new Error("Either recipientId or username is required");
    }
    return true;
  }),
  body("recipientId")
    .optional()
    .isMongoId()
    .withMessage("recipientId must be a valid Id"),
  body("username")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("username must be between 1 and 50 characters"),
];

export const requestIdValidator = [
  param("requestId").isMongoId().withMessage("requestId must be a valid Id"),
];

export const friendIdValidator = [
  param("friendId").isMongoId().withMessage("friendId must be a valid Id"),
];

export const searchConnectionValidator = [
  query("q").optional().trim(),
];
