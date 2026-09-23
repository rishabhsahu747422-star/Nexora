import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      trim: true,
    },
    channel_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "channels",
      required: true,
    },
    author_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    attachments: [
      {
        url: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enu: ["image", "video", "file"],
        },
      },
    ],
  },
  { timestamps: true },
);

const messageModel = mongoose.model("messages", messageSchema);

export default messageModel;
