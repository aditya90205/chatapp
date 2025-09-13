"use client";

import Loading from "@/components/Loading";
import Sidebar from "@/components/Sidebar";
import { chat_service, useAppContext, User } from "@/context/AppContext";
import { useSocketContext } from "@/context/SocketContext";
import { Message } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import axios from "axios";
import ChatHeader from "@/components/ChatHeader";
import ChatMessages from "@/components/ChatMessages";
import MessageInput from "@/components/MessageInput";

const ChatApp = () => {
  const {
    isAuth,
    loading,
    logoutUser,
    chats,
    user: loggedInUser,
    users,
    fetchChats,
  } = useAppContext();

  const {
    socket,
    joinChat,
    leaveChat,
    sendMessage: sendSocketMessage,
    sendTyping,
  } = useSocketContext();

  const [selectedUser, setSelectedUser] = useState<null | string>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState<string>("");
  const [sideBarOpen, setSideBarOpen] = useState<boolean>(false);
  const [user, setUser] = useState<null | User>(null);
  const [showAllUser, setShowAllUser] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  const router = useRouter();

  useEffect(() => {
    if (!isAuth && !loading) {
      router.push("/login");
    }
  }, [isAuth, router, loading]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for new messages
    const handleMessageReceived = (data: { message: Message }) => {
      console.log("Message received via socket:", data);
      setMessages((prev) => {
        const currentMessages = prev || [];
        const messageExists = currentMessages.some(
          (msg) => msg._id === data.message._id
        );
        if (!messageExists) {
          return [...currentMessages, data.message];
        }
        return currentMessages;
      });
    };

    // Listen for typing indicators
    const handleUserTyping = (data: { isTyping: boolean; userId: string }) => {
      console.log("User typing event:", data);
      // Only show typing indicator if it's not the current user
      if (data.userId !== loggedInUser?._id) {
        setIsTyping(data.isTyping);
        
        // Clear typing indicator after a few seconds
        if (data.isTyping) {
          if (typingTimeout) clearTimeout(typingTimeout);
          const timeout = setTimeout(() => setIsTyping(false), 3000);
          setTypingTimeout(timeout);
        }
      }
    };

    // Listen for message seen updates
    const handleMessageSeen = (data: { messageId: string; seenByUserId: string }) => {
      console.log("Message seen update:", data);
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId
            ? { ...msg, seen: true, seenAt: new Date().toISOString() }
            : msg
        )
      );
    };

    socket.on("message_received", handleMessageReceived);
    socket.on("user_typing", handleUserTyping);
    socket.on("message_seen_update", handleMessageSeen);

    return () => {
      socket.off("message_received", handleMessageReceived);
      socket.off("user_typing", handleUserTyping);
      socket.off("message_seen_update", handleMessageSeen);
    };
  }, [socket, loggedInUser?._id, typingTimeout]);

  // Handle joining/leaving chat rooms when selectedUser changes
  useEffect(() => {
    if (selectedUser) {
      joinChat(selectedUser);
      
      return () => {
        leaveChat(selectedUser);
      };
    }
  }, [selectedUser, joinChat, leaveChat]);

  const handleLogout = () => {
    logoutUser();
  };

  const fetchChat = useCallback(async () => {
    if (!selectedUser) return;
    
    try {
      const token = Cookies.get("token");
      const { data } = await axios.get(
        `${chat_service}/message/${selectedUser}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessages(data.messages);
      setUser(data.user.user);
      await fetchChats();
    } catch (error: unknown) {
      toast.error("Error fetching chats");
      console.error("Fetch chat error:", error);
    }
  }, [selectedUser, fetchChats]);

  async function createChat(user: User) {
    try {
      const token = Cookies.get("token");
      const { data } = await axios.post(
        `${chat_service}/new`,
        {
          userId: loggedInUser?._id,
          otherUserId: user._id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSelectedUser(data.chatId);
      setShowAllUser(false);
      await fetchChats();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error("Error creating chat: " + errorMessage);
      console.error("Create chat error:", error);
    }
  }

  const handleMessageSend = async (
    e: React.FormEvent<HTMLFormElement>,
    imageFile?: File | null
  ) => {
    e.preventDefault();

    if (!message.trim() && !imageFile && !selectedUser) return;

    const token = Cookies.get("token");
    try {
      const formData = new FormData();
      formData.append("chatId", selectedUser!);
      if (message.trim()) formData.append("text", message);
      if (imageFile) formData.append("image", imageFile);

      const { data } = await axios.post(`${chat_service}/message`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Add message to local state immediately for sender
      setMessages((prev) => {
        const currentMessages = prev || [];
        const messageExists = currentMessages.some(
          (msg) => msg._id === data.message._id
        );
        if (!messageExists) {
          return [...currentMessages, data.message];
        }
        return currentMessages;
      });

      // Send message via socket for real-time delivery to other users
      if (selectedUser && data.message) {
        sendSocketMessage(selectedUser, data.message);
      }

      setMessage("");
      
      // Update chats list to reflect latest message
      await fetchChats();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error("Error sending message: " + errorMessage);
      console.error("Send message error:", error);
    }
  };

  const handleTyping = (value: string) => {
    setMessage(value);

    if (!selectedUser || !loggedInUser?._id) return;

    // Send typing indicator via socket
    const isTyping = value.trim().length > 0;
    sendTyping(selectedUser, isTyping, loggedInUser._id);

    // Clear typing indicator after user stops typing
    if (typingTimeout) clearTimeout(typingTimeout);
    const timeout = setTimeout(() => {
      sendTyping(selectedUser, false, loggedInUser._id);
    }, 1000);
    setTypingTimeout(timeout);
  };

  useEffect(() => {
    if (selectedUser) {
      fetchChat();
    }
  }, [selectedUser, fetchChat]);

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen flex bg-gray-900 text-white relative overflow-hidden">
      <Sidebar
        sidebarOpen={sideBarOpen}
        setSidebarOpen={setSideBarOpen}
        showAllUsers={showAllUser}
        setShowAllUsers={setShowAllUser}
        users={users}
        loggedInUser={loggedInUser}
        chats={chats}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        handleLogout={handleLogout}
        createChat={createChat}
      />

      <div className="flex-1 flex flex-col justify-between p-4 backdrop-blur-xl bg-white/5 border-1 border-white/10">
        <ChatHeader
          user={user}
          setSidebarOpen={setSideBarOpen}
          isTyping={isTyping}
        />
        <ChatMessages
          selectedUser={selectedUser}
          messages={messages}
          loggedInUser={loggedInUser}
        />

        <MessageInput
          selectedUser={selectedUser}
          message={message}
          setMessage={handleTyping}
          handleMessageSend={handleMessageSend}
        />
      </div>
    </div>
  );
};

export default ChatApp;
