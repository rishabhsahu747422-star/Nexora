import mongoose from "mongoose";

const connectionRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

connectionRequestSchema.index({ sender: 1, recipient: 1, status: 1 });
connectionRequestSchema.index({ recipient: 1, status: 1 });
connectionRequestSchema.index({ sender: 1, status: 1 });

const connectionRequestModel = mongoose.model(
  "connectionRequests",
  connectionRequestSchema
);

export default connectionRequestModel;
