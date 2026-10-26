import { Server } from "socket.io";
import { socketCorsOptions } from "./cors.config.js";
import { socketMiddleware } from "../middlewares/socket.middleware.js";
import channelModel from "../models/channel.model.js";
import conversationModel from "../models/conversation.model.js";
import ApiError from "../utils/ApiError.js";
import serverMemberModel from "../models/serverMember.model.js";

let io = null;
const voiceRooms = new Map();
const socketToVoiceRoom = new Map();
const userSockets = new Map(); // userId -> Set of socketIds

const handleVoiceLeave = (socket, channelId) => {
  if (!channelId) return;
  socketToVoiceRoom.delete(socket.id);

  if (voiceRooms.has(channelId)) {
    const roomMap = voiceRooms.get(channelId);
    roomMap.delete(socket.id);
    if (roomMap.size === 0) {
      voiceRooms.delete(channelId);
    }
  }

  socket.leave(`voice:${channelId}`);

  if (io && socket.user) {
    io.to(`voice:${channelId}`).emit("voice:participant-left", {
      socketId: socket.id,
      userId: socket.user._id ? socket.user._id.toString() : socket.id,
    });
  }
};

export const socketIntialise = (server) => {
  io = new Server(server, {
    cors: socketCorsOptions,
  });

  io.use(socketMiddleware);

  io.on("connection", (socket) => {
    console.log("connected", socket.id);

    // Join authenticated user's private room for direct notifications
    if (socket.user?._id) {
      const userId = socket.user._id.toString();
      socket.join(`user:${userId}`);

      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);

      if (userSockets.get(userId).size === 1) {
        io.emit("user:presence-change", { userId, status: "online" });
      }
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

    // Voice channel room management & signaling
    socket.on("voice:join", async (data) => {
      try {
        const channelId = typeof data === "string" ? data : data?.channelId;
        if (!channelId) {
          throw new ApiError(400, "channelId is required for voice join");
        }

        const channel = await channelModel.findById(channelId);
        if (!channel) {
          throw new ApiError(404, "Voice channel not found");
        }
        if (channel.type !== "voice") {
          throw new ApiError(400, "Requested channel is not a voice channel");
        }

        const member = await serverMemberModel.findOne({
          server: channel.server,
          user: socket.user._id,
        });
        if (!member) {
          throw new ApiError(403, "You are not an authorized member of this server");
        }

        // Leave any previous voice room if switching rooms
        const prevRoomId = socketToVoiceRoom.get(socket.id);
        if (prevRoomId && prevRoomId !== channelId) {
          handleVoiceLeave(socket, prevRoomId);
        }

        if (!voiceRooms.has(channelId)) {
          voiceRooms.set(channelId, new Map());
        }
        const roomMap = voiceRooms.get(channelId);

        const participantData = {
          socketId: socket.id,
          userId: socket.user._id.toString(),
          user: {
            _id: socket.user._id.toString(),
            username: socket.user.username,
            fullname: socket.user.fullname,
            profile_pic: socket.user.profile_pic,
          },
          muted: !!data?.muted,
          deafened: !!data?.deafened,
          video: !!data?.video,
        };

        const existingParticipants = Array.from(roomMap.values());

        roomMap.set(socket.id, participantData);
        socketToVoiceRoom.set(socket.id, channelId);

        socket.join(`voice:${channelId}`);

        socket.emit("voice:joined", {
          channelId,
          channelName: channel.name,
          serverId: channel.server.toString(),
          participants: existingParticipants,
          existingParticipants,
        });

        socket.to(`voice:${channelId}`).emit("voice:participant-joined", participantData);
      } catch (err) {
        socket.emit("voice:error", {
          code: err.statusCode || 500,
          message: err.message,
        });
      }
    });

    socket.on("voice:signal", (data) => {
      try {
        const { targetSocketId, signal } = data || {};
        if (!targetSocketId || !signal) {
          throw new ApiError(400, "Invalid signaling payload");
        }

        const senderRoomId = socketToVoiceRoom.get(socket.id);
        if (!senderRoomId) {
          throw new ApiError(403, "Sender is not connected to a voice channel");
        }

        const targetRoomId = socketToVoiceRoom.get(targetSocketId);
        if (targetRoomId !== senderRoomId) {
          throw new ApiError(403, "Target peer is not in the same voice room");
        }

        io.to(targetSocketId).emit("voice:signal", {
          from: socket.id,
          senderSocketId: socket.id,
          senderUserId: socket.user._id.toString(),
          signal,
        });
      } catch (err) {
        socket.emit("voice:error", {
          code: err.statusCode || 500,
          message: err.message,
        });
      }
    });

    socket.on("voice:toggle-media", (data) => {
      const channelId = socketToVoiceRoom.get(socket.id);
      if (!channelId || !voiceRooms.has(channelId)) return;

      const roomMap = voiceRooms.get(channelId);
      const participant = roomMap.get(socket.id);
      if (participant) {
        if (data.muted !== undefined) participant.muted = !!data.muted;
        if (data.deafened !== undefined) participant.deafened = !!data.deafened;
        if (data.video !== undefined) participant.video = !!data.video;

        io.to(`voice:${channelId}`).emit("voice:participant-updated", {
          socketId: socket.id,
          userId: socket.user._id.toString(),
          muted: participant.muted,
          deafened: participant.deafened,
          video: participant.video,
        });
      }
    });

    socket.on("voice:leave", () => {
      const channelId = socketToVoiceRoom.get(socket.id);
      if (channelId) {
        handleVoiceLeave(socket, channelId);
      }
    });

    socket.on("disconnect", () => {
      const voiceChannelId = socketToVoiceRoom.get(socket.id);
      if (voiceChannelId) {
        handleVoiceLeave(socket, voiceChannelId);
      }

      if (socket.user?._id) {
        const userId = socket.user._id.toString();
        const sockets = userSockets.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            userSockets.delete(userId);
            io.emit("user:presence-change", { userId, status: "offline" });
          }
        }
      }

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

export const isUserOnline = (userId) => {
  if (!userId) return false;
  const uid = userId._id ? userId._id.toString() : userId.toString();
  return userSockets.has(uid) && userSockets.get(uid).size > 0;
};

export const getOnlineUserIds = () => {
  return Array.from(userSockets.keys());
};

export const emitToUser = (userId, event, data) => {
  if (!io || !userId) return;
  const uid = userId._id ? userId._id.toString() : userId.toString();
  io.to(`user:${uid}`).emit(event, data);
};

export const initSocket = socketIntialise;
