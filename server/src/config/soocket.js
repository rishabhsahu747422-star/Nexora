import { Server } from "socket.io";
import { socketMiddleware } from "../middlewares/socket.middleware.js";
import channelModel from "../models/channel.model.js";
import ApiError from "../utils/ApiError.js";
import serverMemberModel from "../models/serverMember.model.js";

export const socketIntialise = (server) => {
  const io = new Server(server);

  io.use(socketMiddleware);

  io.on("connection", (socket) => {
    // console.log(socket);
    console.log("connected", socket.id);

    // yaha se socket ka code start hh
    socket.on("join-channel", async (channelId) => {
      try {
        const channel = await channelModel.findById(channelId);

        if (!channel) {
          throw new ApiError(404, "channel not found ");
        }

        const member = await serverMemberModel.findOne({
          server: channel.server,
          user: socket.user._id,
        });

        if (!member) {
          throw new ApiError(404, "Your are not the memebr of this server");
        }

        socket.join(`channel:${channelId}`);
      } catch (error) {
        socket.emit("channel:error", () => {
          console.log(error);
        });
      }
    });

    socket.on("leave-channel", (channelId) => {
      socket.leave(`channel:${channelId}`);
      console.log(`socket:${socket.id} leaves:${channelId}`);
    });
    // yaha pe khtm h

    socket.on("disconnect", () => {
      console.log("disconnected", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    console.log("socket is not initialise");
    return;
  }
  return io;
};
