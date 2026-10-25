import mongoose from "mongoose";

const directMessageSchema = new mongoose.Schema(
  {
    conversation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "conversations",
      required: true,
      index: true,
    },
    author_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    content: {
      type: String,
      default: "",
    },
    attachments: [
      {
        url: {
          type: String,
        },
        fileType: {
          type: String,
          enum: ["image", "video", "file"],
        },
        filename: {
          type: String,
        },
      },
    ],
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "directMessages",
      default: null,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],
  },
  { timestamps: true }
);

directMessageSchema.index({ conversation_id: 1, createdAt: 1 });

const directMessageModel = mongoose.model("directMessages", directMessageSchema);

export default directMessageModel;
