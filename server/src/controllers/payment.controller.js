import { createHmac, timingSafeEqual } from "node:crypto";
import razorpay from "../config/razorpay.config.js";
import nitroModel from "../models/nitro.model.js";
import paymentModel from "../models/payment.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const nexAmount = 1200;
const subscriptionDurationMs = 30 * 24 * 60 * 60 * 1000;

export const createOrder = async (req, res, next) => {
  try {
    const order = await razorpay.orders.create({
      amount: nexAmount,
      currency: "INR",
      receipt: `nex_${req.user.id}_${Date.now()}`,
    });

    await paymentModel.create({
      user: req.user._id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      product: "nitro",
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
        "Nex+ order created successfully",
      ),
    );
  } catch (error) {
    return next(error);
  }
};

export const verifyNitroPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new ApiError(400, "Razorpay payment details are incomplete.");
    }

    const expectedSignature = createHmac(
      "sha256",
      process.env.RAZOR_PAY_SECRET_KEY,
    )
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(razorpay_signature, "hex");

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      throw new ApiError(400, "Razorpay payment signature is invalid.");
    }

    const payment = await paymentModel.findOne({
      orderId: razorpay_order_id,
      user: req.user._id,
    });

    if (!payment) {
      throw new ApiError(404, "Payment order was not found.");
    }

    if (payment.status === "paid") {
      if (payment.paymentId !== razorpay_payment_id) {
        throw new ApiError(409, "This order is already linked to another payment.");
      }

      return res
        .status(200)
        .json(new ApiResponse(200, null, "Nex+ payment already verified."));
    }

    if (payment.status !== "created") {
      throw new ApiError(409, "This payment order cannot be verified.");
    }

    const existingSubscription = await nitroModel.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (!existingSubscription) {
      const now = new Date();
      const currentSubscription = await nitroModel
        .findOne({
          user: req.user._id,
          status: "active",
          endDate: { $gt: now },
        })
        .sort({ endDate: -1 });
      const startDate = currentSubscription?.startDate || now;
      const endDate = new Date(
        Math.max(currentSubscription?.endDate?.getTime() || now.getTime(), now.getTime()) +
          subscriptionDurationMs,
      );

      if (currentSubscription) {
        currentSubscription.endDate = endDate;
        currentSubscription.razorpayOrderId = razorpay_order_id;
        currentSubscription.razorpayPaymentId = razorpay_payment_id;
        await currentSubscription.save();
      } else {
        await nitroModel.create({
          user: req.user._id,
          startDate,
          endDate,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
        });
      }
    }

    payment.paymentId = razorpay_payment_id;
    payment.status = "paid";
    await payment.save();

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Nex+ payment verified successfully."));
  } catch (error) {
    return next(error);
  }
};

export const getMyNitro = async (req, res, next) => {
  try {
    const subscription = await nitroModel
      .findOne({ user: req.user._id })
      .sort({ endDate: -1 });

    return res
      .status(200)
      .json(new ApiResponse(200, subscription, "Nex+ subscription fetched."));
  } catch (error) {
    return next(error);
  }
};
