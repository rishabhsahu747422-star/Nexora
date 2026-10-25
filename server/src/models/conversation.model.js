import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
      },
    ],
    lastMessage: {
      content: {
        type: String,
        default: "",
      },
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });

const conversationModel = mongoose.model("conversations", conversationSchema);

export default conversationModel;
