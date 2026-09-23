import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 25,
    },
    username: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    mobile_no: {
      type: String,
      required: true,
      sparse: true,
    },
    password: {
      type: String,
      minlength: 6,
    },
    dob: {
      type: Date,
    },
    profile_pic: {
      type: String,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    server: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "servers",
      },
    ],
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],
  },
  { timestamps: true },
);

userSchema.pre("save", function () {
  if (!this.password || this.isModified("password"))
    return (this.password = bcrypt.hashSync(this.password, 10));
});

userSchema.methods.comparePass = function (password) {
  return bcrypt.compareSync(password, this.password);
};

const userModel = mongoose.model("users", userSchema);

export default userModel;
