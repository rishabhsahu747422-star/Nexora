import { Server } from "socket.io";
import { socketMiddleware } from "../middlewares/socket.middleware.js";
import channelModel from "../models/channel.model.js";
import conversationModel from "../models/conversation.model.js";
import ApiError from "../utils/ApiError.js";
import serverMemberModel from "../models/serverMember.model.js";

let io = null;

export const socketIntialise = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        "https://nexora-umber-nine.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
      ],
      credentials: true,
    },
  });

  io.use(socketMiddleware);

  io.on("connection", (socket) => {
    console.log("connected", socket.id);

    // Join authenticated user's private room for direct notifications
    if (socket.user?._id) {
      socket.join(`user:${socket.user._id.toString()}`);
    }

    socket.on("join-channel", async (channelId) => {
      try {
        const channel = await channelModel.findById(channelId);

        if (!channel) {
          throw new ApiError(404, "channel not found");
        }

        const member = await serverMemberModel.findOne({
          server: channel.server,
          user: socket.user._id,
        });

        if (!member) {
          throw new ApiError(403, "You are not a member of this server");
        }

        socket.join(`channel:${channelId}`);
      } catch (error) {
        socket.emit("channel:error", { message: error.message });
      }
    });

    socket.on("leave-channel", (channelId) => {
      socket.leave(`channel:${channelId}`);
      console.log(`socket:${socket.id} leaves channel:${channelId}`);
    });

    socket.on("join-conversation", async (conversationId) => {
      try {
        const conversation = await conversationModel.findById(conversationId);
        if (!conversation) {
          throw new ApiError(404, "Conversation not found");
        }

        const currentUserId = socket.user._id.toString();
        const isParticipant = conversation.participants.some(
          (p) => p.toString() === currentUserId
        );

        if (!isParticipant) {
          throw new ApiError(403, "You are not a participant in this conversation");
        }

        socket.join(`conversation:${conversationId}`);
      } catch (error) {
        socket.emit("conversation:error", { message: error.message });
      }
    });

    socket.on("leave-conversation", (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on("disconnect", () => {
      console.log("disconnected", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    console.log("socket is not initialized");
    return null;
  }
  return io;
};
