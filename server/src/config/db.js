import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("Error in MongoDB connection:", error.message);
    throw error;
  }
};
