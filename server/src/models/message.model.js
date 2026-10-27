import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      trim: true,
    },
    channel_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "channel",
      required: true,
    },
    author_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
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
          enum: ["image", "video", "file"],
        },
      },
    ],
    reactions: [
      {
        emoji: { type: String, required: true },
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
      },
    ],
  },
  { timestamps: true },
);

const messageModel = mongoose.model("messages", messageSchema);

export default messageModel;
