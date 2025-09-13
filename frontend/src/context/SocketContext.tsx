"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAppContext } from "./AppContext";
import { Message } from "@/types";

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[];
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  sendMessage: (chatId: string, message: Message) => void;
  sendTyping: (chatId: string, isTyping: boolean, userId: string) => void;
  markMessageSeen: (chatId: string, messageId: string, userId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  onlineUsers: [],
  joinChat: () => {},
  leaveChat: () => {},
  sendMessage: () => {},
  sendTyping: () => {},
  markMessageSeen: () => {},
});

interface ProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: ProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const { user } = useAppContext();

  useEffect(() => {
    if (!user?._id) {
      // If user is not logged in, disconnect socket
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Connect to socket with user ID as query parameter
    const newSocket = io("http://localhost:5002", {
      query: {
        userId: user._id,
      },
    });

    console.log("Connecting to socket with user ID:", user._id);

    // Set up event listeners
    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
    });

    newSocket.on("getOnlineUsers", (users: string[]) => {
      setOnlineUsers(users);
      console.log("Online users updated:", users);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    setSocket(newSocket);

    return () => {
      console.log("Cleaning up socket connection");
      newSocket.disconnect();
    };
  }, [user?._id]);

  const joinChat = useCallback((chatId: string) => {
    if (socket && chatId) {
      socket.emit("join_chat", chatId);
      console.log("Joined chat:", chatId);
    }
  }, [socket]);

  const leaveChat = useCallback((chatId: string) => {
    if (socket && chatId) {
      socket.emit("leave_chat", chatId);
      console.log("Left chat:", chatId);
    }
  }, [socket]);

  const sendMessage = useCallback((chatId: string, message: Message) => {
    if (socket && chatId && message) {
      socket.emit("new_message", { chatId, message });
      console.log("Message sent via socket:", { chatId, message });
    }
  }, [socket]);

  const sendTyping = useCallback((chatId: string, isTyping: boolean, userId: string) => {
    if (socket && chatId && userId) {
      socket.emit("typing", { chatId, isTyping, userId });
    }
  }, [socket]);

  const markMessageSeen = useCallback((chatId: string, messageId: string, userId: string) => {
    if (socket && chatId && messageId && userId) {
      socket.emit("message_seen", { chatId, messageId, userId });
    }
  }, [socket]);

  const value = {
    socket,
    onlineUsers,
    joinChat,
    leaveChat,
    sendMessage,
    sendTyping,
    markMessageSeen,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocketContext must be used within a SocketProvider");
  }
  return context;
};
