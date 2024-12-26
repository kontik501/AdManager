import { Server } from "socket.io";

interface SocketUserMap {
  [socketId: string]: string;
}

let io: Server;
const socketUserIdMap: SocketUserMap = {};

export const initSocketManager = (server: Server): void => {
  io = server;
};

export const addSocket = (userId: string, socketId: string): void => {
  socketUserIdMap[socketId] = userId;
};

export const removeSocket = (socketId: string): void => {
  delete socketUserIdMap[socketId];
};

export const getSocketIdsByUserId = (userId: string[]): string[] => {
  const matchingSocketIds: string[] = [];

  userId.forEach(userId => {
    const socketId = Object.keys(socketUserIdMap).find(key => socketUserIdMap[key] === userId);
    if (socketId) {
      matchingSocketIds.push(socketId);
    }
  });

  return matchingSocketIds;
};

export const getSocketByUserId = (userId: string): any => {
  const socketId = Object.keys(socketUserIdMap).find(
    (key) => socketUserIdMap[key] === userId
  );
  return socketId;
};



export const emitToUser = (userId: string, event: string, data: any): void => {
  const socketId = Object.keys(socketUserIdMap).find(
    (key) => socketUserIdMap[key] === userId
  );
  if (socketId) {
    io.to(socketId).emit(event, data);
  }
};
