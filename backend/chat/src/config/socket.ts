import { Server, Socket } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const userSocketMap: Record<string, string> = {};

export const getReceiverSocketId = (receiverId: string) => {
  return userSocketMap[receiverId];
};

io.on("connect", (socket: Socket) => {
  console.log("New client connected", socket.id);

  const userId = socket.handshake.query.userId as string;
  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
    console.log(`User ${userId} connected with socket ${socket.id}`);
    
    // Join user to their own room for personal notifications
    socket.join(userId);
    
    // Emit online users to all clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  }

  // Handle joining chat rooms
  socket.on("join_chat", (chatId: string) => {
    socket.join(chatId);
    console.log(`Socket ${socket.id} joined chat room ${chatId}`);
  });

  // Handle leaving chat rooms
  socket.on("leave_chat", (chatId: string) => {
    socket.leave(chatId);
    console.log(`Socket ${socket.id} left chat room ${chatId}`);
  });

  // Handle new message
  socket.on("new_message", (messageData) => {
    const { chatId, message } = messageData;
    // Broadcast to all users in the chat room except sender
    socket.to(chatId).emit("message_received", { message });
  });

  // Handle typing indicators
  socket.on("typing", (data) => {
    const { chatId, isTyping, userId: typingUserId } = data;
    socket.to(chatId).emit("user_typing", { isTyping, userId: typingUserId });
  });

  // Handle message seen
  socket.on("message_seen", (data) => {
    const { chatId, messageId, userId: seenByUserId } = data;
    socket.to(chatId).emit("message_seen_update", { messageId, seenByUserId });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
    
    // Remove user from online users map
    const disconnectedUserId = Object.keys(userSocketMap).find(
      key => userSocketMap[key] === socket.id
    );
    
    if (disconnectedUserId) {
      delete userSocketMap[disconnectedUserId];
      console.log(`User ${disconnectedUserId} disconnected`);
      
      // Emit updated online users to all clients
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });

  socket.on("connect_error", (error) => {
    console.error("Connection error:", error);
  });
});

export { app, server, io };
