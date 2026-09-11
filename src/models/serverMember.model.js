import mongoose from "mongoose";

const serverMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    server: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "servers",
    },
    roles: [
      {
        types: mongoose.Schema.types.ObjectId,
        ref: "roles",
      },
    ],
  },
  { timestamps: true },
);

const serverMemberModel = mongoose.model("serverMember", serverMemberSchema);

export default serverMemberModel;
