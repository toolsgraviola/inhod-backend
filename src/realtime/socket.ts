import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { env } from "../config/env.js";

export const attachRealtimeServer = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(",")
    }
  });

  io.on("connection", (socket) => {
    socket.emit("connected", {
      socketId: socket.id,
      service: "inhod-realtime"
    });

    socket.on("chat:join", (chatId: string) => {
      socket.join(`chat:${chatId}`);
    });

    socket.on("message:send", (payload) => {
      io.to(`chat:${payload.chatId}`).emit("message:new", {
        ...payload,
        deliveredAt: new Date().toISOString()
      });
    });
  });

  return io;
};
