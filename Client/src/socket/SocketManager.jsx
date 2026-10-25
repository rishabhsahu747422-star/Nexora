import React, { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import socket from "./socket.js";
import { addMessage } from "../redux/slices/messageSlice";
import {
  addDmMessage,
  updateConversationLastMessage,
} from "../redux/slices/dmSlice";

const SocketManager = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const selectedChannel = useSelector((state) => state.channels.selectedChannel);
  const selectedChannelId = selectedChannel?._id || selectedChannel?.id;
  const activeDmId = useSelector((state) => state.dms.activeDmId);

  const currentChannelRef = useRef(null);
  const currentDmRef = useRef(null);

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

    socket.on("connect", socketConnectHandler);
    socket.on("connect_error", socketErrorHandler);
    socket.on("message:new", handleNewChannelMessage);
    socket.on("direct-message:new", handleNewDirectMessage);
    socket.on("conversation:update", handleConversationUpdate);

    return () => {
      socket.off("connect", socketConnectHandler);
      socket.off("connect_error", socketErrorHandler);
      socket.off("message:new", handleNewChannelMessage);
      socket.off("direct-message:new", handleNewDirectMessage);
      socket.off("conversation:update", handleConversationUpdate);
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
