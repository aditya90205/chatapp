import TryCatch from "../config/TryCatch.js";
import { AuthRequest } from "../middlewares/isAuth.js";
import Chat from "../models/Chat.js";
import Messages from "../models/Messages.js";

export const createNewChat = TryCatch(async (req: AuthRequest, res) => {
  const userId = req.user?._id;
  const { otherUserId } = req.body;

  if (!userId || !otherUserId) {
    return res
      .status(400)
      .json({ message: "User ID and other user ID are required." });
  }

  // Logic to create a new chat
  const existingChat = await Chat.findOne({
    users: { $all: [userId, otherUserId], $size: 2 },
  });

  if (existingChat) {
    return res
      .status(400)
      .json({ message: "Chat already exists.", chatId: existingChat._id });
  }

  const newChat = await Chat.create({
    users: [userId, otherUserId],
  });

  res
    .status(201)
    .json({ message: "Chat created successfully.", chatId: newChat._id });
});

export const getAllChats = TryCatch(async (req: AuthRequest, res) => {
  const userId = req.user?._id;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required." });
  }

  const chats = await Chat.find({
    users: userId,
  }).sort({ updateAt: -1 });

  const chatWithUserData = await Promise.all(
    chats.map(async (chat) => {
      const otherUserId = chat.users.find((id) => id !== userId);

      const unseenMessagesCount = await Messages.countDocuments({
        chatId: chat._id,
        seen: false,
        sender: { $ne: userId },
      });

      try {
        const { data } = await axios.get(
          `${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`
        );

        return {
          user: data,
          chat: {
            ...chat.toObject(),
            unseenMessagesCount,
            latestMessage: chat.latestMessage,
          },
        };
        //           {
        //   user: { _id: "alice_id", name: "Alice", email: "alice@example.com" },
        //   chat: {
        //     _id: "chat1",
        //     users: ["john_id", "alice_id"],
        //     latestMessage: { text: "Hey there!", sender: "alice_id" },
        //     unseenMessagesCount: 3,
        //     createdAt: "2024-01-15T10:30:00Z",
        //     updatedAt: "2024-01-15T14:22:00Z"
        //   }
        // }
      } catch (error) {
        console.log(`Error fetching user data for chat ${chat._id}:`, error);
        return {
          user: { _id: otherUserId, name: "Unknown User" },
          chat: {
            ...chat.toObject(),
            unseenMessagesCount,
            latestMessage: chat.latestMessage,
          },
        };
      }
    })
  );

  res.json({
    message: "Chats retrieved successfully.",
    chats: chatWithUserData,
  });

  //     {
  //   "message": "Chats retrieved successfully.",
  //   "chats": [
  //     {
  //       "user": {
  //         "_id": "alice_id",
  //         "name": "Alice Smith",
  //         "email": "alice@example.com",
  //         "avatar": "https://example.com/alice.jpg"
  //       },
  //       "chat": {
  //         "_id": "chat1",
  //         "users": ["john_id", "alice_id"],
  //         "latestMessage": {
  //           "text": "See you tomorrow!",
  //           "sender": "alice_id"
  //         },
  //         "unseenMessagesCount": 2,
  //         "createdAt": "2024-01-15T10:30:00Z",
  //         "updatedAt": "2024-01-15T16:45:00Z"
  //       }
  //     },
  //     {
  //       "user": {
  //         "_id": "bob_id",
  //         "name": "Bob Johnson",
  //         "email": "bob@example.com",
  //         "avatar": "https://example.com/bob.jpg"
  //       },
  //       "chat": {
  //         "_id": "chat2",
  //         "users": ["john_id", "bob_id"],
  //         "latestMessage": {
  //           "text": "Thanks for the help!",
  //           "sender": "john_id"
  //         },
  //         "unseenMessagesCount": 0,
  //         "createdAt": "2024-01-14T09:15:00Z",
  //         "updatedAt": "2024-01-15T11:20:00Z"
  //       }
  //     }
  //   ]
  // }
});
