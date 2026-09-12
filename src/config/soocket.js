import { Server } from "socket.io";

export const socketIntialise = (server) => {
  const io = new Server(server);

  io.on("connection", (socket) => {
    console.log(socket);

    console.log("connected", socket.id);

    socket.on("disconnect", () => {
      console.log("disconnected", socket.id);
    });
  });

  return io;
};
