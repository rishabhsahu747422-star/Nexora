import { io } from "socket.io-client";
 
const cleanSocketUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== "string") {
    return "https://nexora-ikwc.onrender.com";
  }
  let cleaned = rawUrl.trim().replace(/\/+$/, "");
  if (cleaned.endsWith("/socket.io")) {
    cleaned = cleaned.slice(0, -"/socket.io".length);
  }
  if (cleaned.endsWith("/api")) {
    cleaned = cleaned.slice(0, -"/api".length);
  }
  return cleaned.replace(/\/+$/, "");
};

const rawSocketUrl =
  import.meta.env.VITE_SOCKET_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://nexora-ikwc.onrender.com");

const socket = io(cleanSocketUrl(rawSocketUrl), {
  withCredentials: true,
  autoConnect: false,
});

export default socket;
