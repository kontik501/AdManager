import { Server } from "socket.io";
import http from "http";

let io: Server;

export const initSocket = (server: http.Server): Server => {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
    transports: ["websocket", "polling"],
  });
  return io;
};

export const getSocket = (): Server => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
