import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import socket from "./socket.js";

const SocketManager = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated) return socket.connect();

    const socketConnectHandler = () => {
      console.log("socket connected", socket.id);
    };
    const socketErrorHandler = (error) => {
      console.log("connection error", error);
    };

    socket.on("connect", socketConnectHandler);
    socket.on("connect-error", socketErrorHandler);

    return () => {
      socket.off("connect", socketConnectHandler);
      socket.off("error", socketErrorHandler);
      socket.disconnect();
    };
  }, [isAuthenticated]);

  return null;
};

export default SocketManager;
