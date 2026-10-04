import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  WithCredentials: true,
  autoConnect: false,
});

export default socket;
