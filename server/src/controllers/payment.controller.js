import crypto from "node:crypto";
import razorpay from "../config/razorpay.config.js";
import nexModel from "../models/nex.model.js";
import paymentModel from "../models/payment.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const Nex_amount = 500000;
const NEX_DURATION_DAYS = 30;
export const createOrder = async (req, res, next) => {
  try {
    const order = await razorpay.orders.create({
      amount: Nex_amount,
      currency: "INR",
      receipt: `Nex_${req.user._id}_${Date.now()}`,
    });

    await paymentModel.create({
      user: req.user._id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      product: "Nex",
      status: "created",
    });

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          keyId: process.env.RAZOR_PAY_API_KEY,
        },
        "Nex+ order created succesfully",
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const verifyNexPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    } = req.body;

    if (!orderId || !paymentId || !signature) {
      throw new ApiError(400, "Payment verification details are requuired");
    }

    const payment = await paymentModel.findOne({
      orderId,
      user: req.user._id,
      product: "Nex",
    });

    if (!payment) {
      throw new ApiError(404, "Payment order not found");
    }

    if (payment.status === "paid") {
      if (payment.paymentId !== paymentId) {
        throw new ApiError(400, "Payment does not match this order");
      }

      const existingNex = await nexModel.findOne({
        user: req.user._id,
        razorpayPaymentId: paymentId,
      });

      if (existingNex) {
        return res
          .status(200)
          .json(
            new ApiResponse(
              200,
              { paymentId, endDate: existingNex.endDate },
              "Payment already verified",
            ),
          );
      }
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZOR_PAY_SECRET_KEY)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const signatureMatch =
      expectedSignature.length === signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature),
      );

    if (!signatureMatch) {
      throw new ApiError(400, "Invalid payment signature");
    }

    const order = await razorpay.orders.fetch(orderId);
    if (
      order.amount !== payment.amount ||
      order.currency !== payment.currency ||
      order.status !== "paid"
    ) {
      throw new ApiError(400, "Payment amount or status couldn't verified");
    }

    payment.paymentId = paymentId;
    payment.status = "paid";
    await payment.save();

    const now = new Date();
    const currentNex = await nexModel.findOne({
      user: req.user._id,
      status: "active",
      endDate: { $gt: now },
    });
    const startDate = currentNex ? currentNex.startDate : now;
    const endDate = new Date(
      (currentNex ? currentNex.endDate : now).getTime() +
        NEX_DURATION_DAYS * 24 * 60 * 60 * 1000,
    );

    await nexModel.findOneAndUpdate(
      { user: req.user._id, status: "active" },
      {
        user: req.user._id,
        plan: "Nex",
        status: "active",
        startDate,
        endDate,
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
      },
      { upsert: true, new: true },
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { paymentId, endDate },
          "Nex+ payment verified successfully",
        ),
      );
  } catch (error) {
    next(error);
  }
};

export const getMyNex = async (req, res, next) => {
  try {
    const nex = await nexModel.findOne({
      user: req.user._id,
      status: "active",
      endDate: { $gt: new Date() },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, nex, "Nex+ status fetched successfully"));
  } catch (error) {
    next(error);
  }
};
