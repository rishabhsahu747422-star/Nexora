export const registerValidator = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("username is Required")
    .isLength({ min: 3, max: 20 })
    .withMessage("username must bw between 3 and 20 characters"),

  body("email")
    .trim()
    .normalizeEmail()
    .notEmpty()
    .withMessage("Email is REquired")
    .isEmail()
    .withMessage("Please provide vadil email"),

  body("fullname").notEmpty().withMessage("Fullnaem is required"),
];

export const loginValidator = [
  body("email")
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage("Email is required"),

  body("password")
    .isString()
    .isLength({ min: 6 })
    .withMessage("password must be at least 6 characters"),
];

export const forgotPasswordValidator = [
  body("email")
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage("Not a valid email"),
  body("otp").isLength({ min: 4, max: 8 }).withMessage("OTP is invalid"),
];

export const resetPasswordValidator = [
  body("email")
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage("Please provide a valid email"),
  body("resetToken").trim().notEmpty().withMessage("Reset token is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];
