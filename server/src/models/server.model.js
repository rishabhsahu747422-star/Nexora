import mongoose from "mongoose";

const serverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      ref: "user",
    },
    description: {
      type: String,
    },
    icon: {
      type: String,
      default: "",
    },
    banner: {
      type: String,
      default: "",
    },
    inviteCode: {
      type: String,
    },
    // serverId: {
    //   type: String,
    // },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const serverModel = mongoose.model("server", serverSchema);

export default serverModel;
