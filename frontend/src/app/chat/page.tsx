"use client";

import Loading from "@/components/Loading";
import Sidebar from "@/components/Sidebar";
import { chat_service, useAppContext, User } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import axios from "axios";
import ChatHeader from "@/components/ChatHeader";
import ChatMessages from "@/components/ChatMessages";

export interface Message {
  _id: string;
  chatId: string;
  sender: string;
  text?: string;
  image?: {
    url: string;
    publicId: string;
  };
  messageType: "text" | "image";
  seen: boolean;
  seenAt?: string;
  createdAt: string;
}

const ChatApp = () => {
  const {
    isAuth,
    loading,
    logoutUser,
    chats,
    user: loggedInUser,
    users,
    fetchChats,
    setChats,
  } = useAppContext();

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

  const handleLogout = () => {
    logoutUser();
  };

  async function fetchChat() {
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
    } catch (error) {
      toast.error("Error fetching chats", error);
    }
  }

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
    } catch (error: any) {
      toast.error("Error creating chat", error);
    }
  }

  useEffect(() => {
    if (selectedUser) {
      fetchChat();
    }
  }, [selectedUser]);

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
      </div>
    </div>
  );
};

export default ChatApp;
