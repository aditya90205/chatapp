"use client";

import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import Cookies from "js-cookie";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

export const user_service = "http://localhost:5000/api/v1/user";
export const chat_service = "http://localhost:5002/api/v1/chat";

export interface User {
  _id: string;
  email: string;
  name: string;
}

export interface Chat {
  _id: string;
  users: string[];
  latestMessage: {
    text: string;
    sender: string;
  };
  createdAt: string;
  updatedAt: string;
  unseenCount?: number;
}

export interface Chats {
  _id: string;
  chat: Chat;
  user: User;
}

interface AppContextType {
  user: User | null;
  loading: boolean;
  isAuth: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
  logoutUser: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchChats: () => Promise<void>;
  chats: Chats[] | null;
  users: User[] | null;
  setChats: React.Dispatch<React.SetStateAction<Chats[] | null>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuth, setIsAuth] = useState<boolean>(false);

  async function fetchUser() {
    setLoading(true);
    try {
      const token = Cookies.get("token");
      const { data } = await axios.get(`${user_service}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUser(data.user);
      setIsAuth(true);
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  }

  async function logoutUser() {
    Cookies.remove("token");
    setUser(null);
    setIsAuth(false);
    toast.success("Logged out successfully");
  }

  const [chats, setChats] = useState<Chats[] | null>(null);
  async function fetchChats() {
    const token = Cookies.get("token");
    try {
      const { data } = await axios.get(`${chat_service}/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setChats(data.chats);
    } catch (error) {
      console.log("Fetch Chat Error:", error);
    }
  }

  const [users, setUsers] = useState<User[] | null>(null);

  async function fetchUsers() {
    const token = Cookies.get("token");
    try {
      const { data } = await axios.get(`${user_service}/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // console.log("Fetched Users:", data.users);
      setUsers(data.users);
    } catch (error) {
      console.log("Fetch User error", error);
    }
  }

  useEffect(() => {
    fetchUser();
    fetchChats();
    fetchUsers();
  }, []);

  const value = {
    user,
    loading,
    isAuth,
    setUser,
    setIsAuth,
    logoutUser,
    fetchChats,
    fetchUsers,
    chats,
    users,
    setChats,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      <Toaster />
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
