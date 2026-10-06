import mongoose, { mongo } from "mongoose";

const nexSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    plan: {
      type: String,
      enum: ["Nex"],
      default: "Nex",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true },
);

const nexModel = mongoose.model("nex+", nexSchema);

export default nexModel;
