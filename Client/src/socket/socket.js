import { io } from "socket.io-client";
 
const socketUrl =
  import.meta.env.VITE_SOCKET_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://nexora-ikwc.onrender.com");

const socket = io(socketUrl, {
  withCredentials: true,
  autoConnect: false,
});

export default socket;
