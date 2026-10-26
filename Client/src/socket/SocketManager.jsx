import React, { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import socket from "./socket.js";
import { addMessage } from "../redux/slices/messageSlice";
import {
  addDmMessage,
  updateConversationLastMessage,
} from "../redux/slices/dmSlice";
import {
  connectedVoiceChannel,
  addVoiceParticipant,
  removeVoiceParticipant,
  updateVoiceParticipant,
  setVoiceError,
  setUserSpeaking,
} from "../redux/slices/voiceSlice";
import { addToast } from "../redux/slices/uiSlice";
import webrtc from "../services/webrtc.service";
import {
  onConnectionRequestReceived,
  onConnectionRequestAccepted,
  onConnectionRequestDeclined,
  onConnectionRequestCancelled,
  onConnectionRemoved,
  onUserPresenceChange,
} from "../redux/slices/friendSlice";

const SocketManager = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const selectedChannel = useSelector((state) => state.channels.selectedChannel);
  const selectedChannelId = selectedChannel?._id || selectedChannel?.id;
  const activeDmId = useSelector((state) => state.dms.activeDmId);

  const currentChannelRef = useRef(null);
  const currentDmRef = useRef(null);

  // Bind WebRTC local speaking detector to Redux state
  useEffect(() => {
    webrtc.onSpeakingChange = (isSpeaking) => {
      dispatch(setUserSpeaking(isSpeaking));
    };
  }, [dispatch]);

  // Manage connection lifecycle and global listeners
  useEffect(() => {
    if (!isAuthenticated) {
      if (socket.connected) {
        socket.disconnect();
      }
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    const socketConnectHandler = () => {
      console.log("Socket connected:", socket.id);
      if (currentChannelRef.current) {
        socket.emit("join-channel", currentChannelRef.current);
      }
      if (currentDmRef.current) {
        socket.emit("join-conversation", currentDmRef.current);
      }
    };

    const socketErrorHandler = (error) => {
      console.log("Socket connection error:", error);
    };

    const handleNewChannelMessage = (message) => {
      if (message) {
        dispatch(addMessage(message));
      }
    };

    const handleNewDirectMessage = (message) => {
      if (message) {
        dispatch(addDmMessage(message));
      }
    };

    const handleConversationUpdate = (update) => {
      if (update) {
        dispatch(updateConversationLastMessage(update));
      }
    };

    // Voice signaling handlers
    const handleVoiceJoined = ({ channelId, participants }) => {
      console.log("[Voice] Joined voice channel:", channelId, "Participants:", participants);
      dispatch(connectedVoiceChannel({ channelId, participants }));

      // Connect to each existing peer as offer initiator
      participants.forEach((peer) => {
        if (peer.socketId !== socket.id) {
          webrtc.createPeerConnection(peer.socketId, peer.user, true);
        }
      });
    };

    const handleVoiceParticipantJoined = (participant) => {
      console.log("[Voice] Participant joined:", participant);
      dispatch(addVoiceParticipant(participant));
      // The newly joined participant will initiate offers to us
    };

    const handleVoiceParticipantLeft = ({ socketId, userId }) => {
      console.log("[Voice] Participant left:", socketId, userId);
      dispatch(removeVoiceParticipant({ socketId, userId }));
      webrtc.closePeer(socketId);
    };

    const handleVoiceParticipantUpdated = (data) => {
      dispatch(updateVoiceParticipant(data));
    };

    const handleVoiceSignal = async ({ senderSocketId, senderUser, signal }) => {
      try {
        await webrtc.handleSignal(senderSocketId, signal, senderUser);
      } catch (err) {
        console.error("[Voice] Error handling signal:", err);
      }
    };

    const handleVoiceError = ({ message }) => {
      console.error("[Voice] Signaling error:", message);
      dispatch(setVoiceError(message));
      dispatch(addToast({ type: "error", message }));
    };

    // Connection & Presence event handlers
    const handleConnectionRequestReceived = (req) => {
      dispatch(onConnectionRequestReceived(req));
      if (req?.name) {
        dispatch(
          addToast({
            type: "info",
            message: `New connection request from ${req.name} (@${req.username})`,
          })
        );
      }
    };

    const handleConnectionRequestAccepted = (payload) => {
      dispatch(onConnectionRequestAccepted(payload));
      if (payload?.friend?.name) {
        dispatch(
          addToast({
            type: "success",
            message: `${payload.friend.name} accepted your connection request!`,
          })
        );
      }
    };

    const handleConnectionRequestDeclined = (payload) => {
      dispatch(onConnectionRequestDeclined(payload));
    };

    const handleConnectionRequestCancelled = (payload) => {
      dispatch(onConnectionRequestCancelled(payload));
    };

    const handleConnectionRemoved = (payload) => {
      dispatch(onConnectionRemoved(payload));
    };

    const handleUserPresenceChange = (payload) => {
      dispatch(onUserPresenceChange(payload));
    };

    socket.on("connect", socketConnectHandler);
    socket.on("connect_error", socketErrorHandler);
    socket.on("message:new", handleNewChannelMessage);
    socket.on("direct-message:new", handleNewDirectMessage);
    socket.on("conversation:update", handleConversationUpdate);

    socket.on("voice:joined", handleVoiceJoined);
    socket.on("voice:participant-joined", handleVoiceParticipantJoined);
    socket.on("voice:participant-left", handleVoiceParticipantLeft);
    socket.on("voice:participant-updated", handleVoiceParticipantUpdated);
    socket.on("voice:signal", handleVoiceSignal);
    socket.on("voice:error", handleVoiceError);

    socket.on("connection:request-received", handleConnectionRequestReceived);
    socket.on("connection:request-accepted", handleConnectionRequestAccepted);
    socket.on("connection:request-declined", handleConnectionRequestDeclined);
    socket.on("connection:request-cancelled", handleConnectionRequestCancelled);
    socket.on("connection:removed", handleConnectionRemoved);
    socket.on("user:presence-change", handleUserPresenceChange);

    return () => {
      socket.off("connect", socketConnectHandler);
      socket.off("connect_error", socketErrorHandler);
      socket.off("message:new", handleNewChannelMessage);
      socket.off("direct-message:new", handleNewDirectMessage);
      socket.off("conversation:update", handleConversationUpdate);

      socket.off("voice:joined", handleVoiceJoined);
      socket.off("voice:participant-joined", handleVoiceParticipantJoined);
      socket.off("voice:participant-left", handleVoiceParticipantLeft);
      socket.off("voice:participant-updated", handleVoiceParticipantUpdated);
      socket.off("voice:signal", handleVoiceSignal);
      socket.off("voice:error", handleVoiceError);

      socket.off("connection:request-received", handleConnectionRequestReceived);
      socket.off("connection:request-accepted", handleConnectionRequestAccepted);
      socket.off("connection:request-declined", handleConnectionRequestDeclined);
      socket.off("connection:request-cancelled", handleConnectionRequestCancelled);
      socket.off("connection:removed", handleConnectionRemoved);
      socket.off("user:presence-change", handleUserPresenceChange);

      socket.disconnect();
    };
  }, [isAuthenticated, dispatch]);

  // Manage channel room subscription
  useEffect(() => {
    if (!isAuthenticated || !socket) return;

    const prevChannelId = currentChannelRef.current;
    if (prevChannelId && prevChannelId !== selectedChannelId) {
      socket.emit("leave-channel", prevChannelId);
    }

    if (selectedChannelId) {
      currentChannelRef.current = selectedChannelId;
      if (socket.connected) {
        socket.emit("join-channel", selectedChannelId);
      }
    } else {
      currentChannelRef.current = null;
    }
  }, [selectedChannelId, isAuthenticated]);

  // Manage direct conversation room subscription
  useEffect(() => {
    if (!isAuthenticated || !socket) return;

    const prevDmId = currentDmRef.current;
    if (prevDmId && prevDmId !== activeDmId) {
      socket.emit("leave-conversation", prevDmId);
    }

    if (activeDmId) {
      currentDmRef.current = activeDmId;
      if (socket.connected) {
        socket.emit("join-conversation", activeDmId);
      }
    } else {
      currentDmRef.current = null;
    }
  }, [activeDmId, isAuthenticated]);

  return null;
};

export default SocketManager;
