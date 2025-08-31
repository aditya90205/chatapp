"use client";

import Loading from "@/components/Loading";
import Sidebar from "@/components/Sidebar";
import { useAppContext, User } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
    router.push("/login");
  };

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
      />
    </div>
  );
};

export default ChatApp;
