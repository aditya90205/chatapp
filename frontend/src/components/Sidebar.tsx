import { User } from "@/context/AppContext";
import { MessageCircle, Plus, Search, UserCircle, X } from "lucide-react";
import { useState } from "react";

interface ChatSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  showAllUsers: boolean;
  setShowAllUsers: (show: boolean | ((prev: boolean) => boolean)) => void;
  users: User[] | null;
  loggedInUser: User | null;
  chats: any[] | null;
  selectedUser: string | null;
  setSelectedUser: (userId: string | null) => void;
  handleLogout: () => void;
}

const Sidebar = ({
  sidebarOpen,
  setSidebarOpen,
  showAllUsers,
  setShowAllUsers,
  users,
  loggedInUser,
  chats,
  selectedUser,
  setSelectedUser,
  handleLogout,
}: ChatSidebarProps) => {

  console.log("Users", users);
  console.log("Logged in Users", loggedInUser);

  const [searchQuery, setSearchQuery] = useState("");
  return (
    <aside
      className={`fixed z-20 sm:static top-0 left-0 h-screen w-80 bg-gray-900 border-r border-gray-700 transform ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } sm:translate-x-0 transition-transform duration-300 flex flex-col
  `}
    >
      {/* header */}
      <div className="p-6 border-b border-gray-700">
        <div className="sm:hidden flex justify-end mb-0">
          <button
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 justify-between">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {showAllUsers ? "New Chat" : "Messages"}
            </h2>
          </div>

          <button
            className={`p-2.5 hover:bg-gray-700 rounded-lg transition-colors ${
              showAllUsers
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
            onClick={() => setShowAllUsers((prev) => !prev)}
          >
            {showAllUsers ? (
              <X className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden px-4 py-2">
        {showAllUsers ? (
          <div className="space-y-4 h-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search Users..."
                className="w-full pl-10 py-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Users list */}
            <div className="h-full pb-4 overflow-y-auto space-y-2">
              {users
                ?.filter(
                  (user) =>
                    user._id !== loggedInUser?._id &&
                    user.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((user) => (
                  <button
                    key={user._id}
                    className="w-full text-left p-4 border border-gray-700 hover:border-gray-600 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <UserCircle className="w-6 h-6 text-gray-300" />
                      </div>
                      {/*TODO: Online Symbol to Show */}
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-white">
                        {user.name}
                      </span>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {/*TODO: To show online and offilne text */}
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
