"use client";

import Loading from "@/components/Loading";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const ChatApp = () => {
  const { isAuth, loading } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!isAuth && !loading) {
      router.push("/login");
    }
  }, [isAuth, router, loading]);

  if (loading) return <Loading />;

  return <div>ChatApp</div>;
};

export default ChatApp;
