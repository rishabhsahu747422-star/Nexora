import React, { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import socket from "./socket.js";
import api from "../config/api.js";
import { addMessage, updateChannelReactions } from "../redux/slices/messageSlice";
import {
  addDmMessage,
  removeDmMessage,
  addConversation,
  updateConversationLastMessage,
  updateDmReactions,
} from "../redux/slices/dmSlice";
import {
  connectedVoiceChannel,
  addVoiceParticipant,
  removeVoiceParticipant,
  updateVoiceParticipant,
  setVoiceError,
  setUserSpeaking,
  setIncomingCall,
  clearIncomingCall,
  updateDirectCallId,
  setDirectCallConnected,
  endDirectCall,
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

    const socketConnectHandler = () => {
      console.log("Socket connected:", socket.id);
      if (currentChannelRef.current) {
        socket.emit("join-channel", currentChannelRef.current);
      }
      if (currentDmRef.current) {
        socket.emit("join-conversation", currentDmRef.current);
      }
    };

    const socketErrorHandler = async (error) => {
      console.warn("Socket connection error:", error?.message || error);
      // Attempt refreshing session if rejected due to token expiry
      if (error?.message && /auth/i.test(error.message)) {
        try {
          await api.post("/auth/refresh");
          if (!socket.connected) {
            socket.connect();
          }
        } catch {
          // Refresh endpoint failed
        }
      }
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

    const handleDirectMessageDelete = (payload) => {
      if (payload?.messageId) {
        dispatch(removeDmMessage(payload.messageId));
      }
    };

    const handleConversationCreated = (conversation) => {
      if (conversation) {
        dispatch(addConversation(conversation));
      }
    };

    const handleConversationUpdate = (update) => {
      if (update) {
        dispatch(updateConversationLastMessage(update));
      }
    };

    const handleDirectMessageReaction = (payload) => {
      if (payload) {
        dispatch(updateDmReactions(payload));
      }
    };

    const handleChannelReaction = (payload) => {
      if (payload) {
        dispatch(updateChannelReactions(payload));
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

    // Direct Call event handlers
    const handleDirectCallIncoming = ({ callId, caller, isVideo, conversationId }) => {
      console.log("[DirectCall] Incoming call:", callId, caller);
      dispatch(setIncomingCall({ callId, caller, isVideo, conversationId }));
    };

    const handleDirectCallOutgoing = ({ callId }) => {
      console.log("[DirectCall] Outgoing call acknowledged with ID:", callId);
      if (callId) {
        webrtc.currentCallId = callId;
        dispatch(updateDirectCallId({ callId }));
      }
    };

    const handleDirectCallAccepted = ({
      callId,
      recipientUser,
      recipientSocketId,
      callerUser,
      callerSocketId,
    }) => {
      console.log("[DirectCall] Call accepted for callId:", callId);
      if (callId) {
        webrtc.currentCallId = callId;
      }

      const isCaller = socket.id === callerSocketId;
      const peer = isCaller ? recipientUser : callerUser;
      dispatch(setDirectCallConnected({ callId, peer }));

      // Only the caller initiates the WebRTC offer to recipient
      if (isCaller && recipientSocketId) {
        console.log(`[DirectCall] Caller creating initiator peer connection to recipient ${recipientSocketId}`);
        webrtc.createPeerConnection(recipientSocketId, recipientUser, true);
      }
    };

    const handleDirectCallRejected = ({ reason }) => {
      console.log("[DirectCall] Call rejected:", reason);
      webrtc.cleanup();
      dispatch(endDirectCall());
      dispatch(clearIncomingCall());
      dispatch(
        addToast({
          type: "info",
          message: reason === "declined" ? "Call declined" : "Call unavailable",
        })
      );
    };

    const handleDirectCallEnded = () => {
      console.log("[DirectCall] Call ended");
      webrtc.cleanup();
      dispatch(endDirectCall());
      dispatch(clearIncomingCall());
      dispatch(addToast({ type: "info", message: "Transmission ended" }));
    };

    const handleDirectCallSignal = async ({ senderSocketId, senderUser, signal, callId }) => {
      try {
        await webrtc.handleSignal(senderSocketId, signal, senderUser, callId);
      } catch (err) {
        console.error("[DirectCall] Error handling signal:", err);
      }
    };

    socket.on("connect", socketConnectHandler);
    socket.on("connect_error", socketErrorHandler);
    socket.on("message:new", handleNewChannelMessage);
    socket.on("channel:reaction", handleChannelReaction);
    socket.on("direct-message:new", handleNewDirectMessage);
    socket.on("direct-message:delete", handleDirectMessageDelete);
    socket.on("direct-message:reaction", handleDirectMessageReaction);
    socket.on("conversation:created", handleConversationCreated);
    socket.on("conversation:update", handleConversationUpdate);

    socket.on("voice:joined", handleVoiceJoined);
    socket.on("voice:participant-joined", handleVoiceParticipantJoined);
    socket.on("voice:participant-left", handleVoiceParticipantLeft);
    socket.on("voice:participant-updated", handleVoiceParticipantUpdated);
    socket.on("voice:signal", handleVoiceSignal);
    socket.on("voice:error", handleVoiceError);

    socket.on("direct-call:incoming", handleDirectCallIncoming);
    socket.on("direct-call:outgoing", handleDirectCallOutgoing);
    socket.on("direct-call:accepted", handleDirectCallAccepted);
    socket.on("direct-call:rejected", handleDirectCallRejected);
    socket.on("direct-call:ended", handleDirectCallEnded);
    socket.on("direct-call:signal", handleDirectCallSignal);

    socket.on("connection:request-received", handleConnectionRequestReceived);
    socket.on("connection:request-accepted", handleConnectionRequestAccepted);
    socket.on("connection:request-declined", handleConnectionRequestDeclined);
    socket.on("connection:request-cancelled", handleConnectionRequestCancelled);
    socket.on("connection:removed", handleConnectionRemoved);
    socket.on("user:presence-change", handleUserPresenceChange);

    if (!socket.connected) {
      socket.connect();
    } else {
      socketConnectHandler();
    }

    return () => {
      socket.off("connect", socketConnectHandler);
      socket.off("connect_error", socketErrorHandler);
      socket.off("message:new", handleNewChannelMessage);
      socket.off("channel:reaction", handleChannelReaction);
      socket.off("direct-message:new", handleNewDirectMessage);
      socket.off("direct-message:delete", handleDirectMessageDelete);
      socket.off("direct-message:reaction", handleDirectMessageReaction);
      socket.off("conversation:created", handleConversationCreated);
      socket.off("conversation:update", handleConversationUpdate);

      socket.off("voice:joined", handleVoiceJoined);
      socket.off("voice:participant-joined", handleVoiceParticipantJoined);
      socket.off("voice:participant-left", handleVoiceParticipantLeft);
      socket.off("voice:participant-updated", handleVoiceParticipantUpdated);
      socket.off("voice:signal", handleVoiceSignal);
      socket.off("voice:error", handleVoiceError);

      socket.off("direct-call:incoming", handleDirectCallIncoming);
      socket.off("direct-call:outgoing", handleDirectCallOutgoing);
      socket.off("direct-call:accepted", handleDirectCallAccepted);
      socket.off("direct-call:rejected", handleDirectCallRejected);
      socket.off("direct-call:ended", handleDirectCallEnded);
      socket.off("direct-call:signal", handleDirectCallSignal);

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
