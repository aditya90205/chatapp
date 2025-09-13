import axios from "axios";
import TryCatch from "../config/TryCatch.js";
import { AuthRequest } from "../middlewares/isAuth.js";
import Chat from "../models/Chat.js";
import Messages from "../models/Messages.js";
import { getReceiverSocketId, io } from "../config/socket.js";

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

export const sendMessage = TryCatch(async (req: AuthRequest, res) => {
  const senderId = req.user?._id;
  const { chatId, text } = req.body;

  if (!senderId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!chatId) {
    return res.status(400).json({ message: "Chat ID is required." });
  }

  const imageFile = req.file;

  if (!text && !imageFile) {
    return res
      .status(400)
      .json({ message: "Message text or image is required." });
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    return res.status(404).json({ message: "Chat not found." });
  }

  const isUserInChat = chat.users.some(
    (userId) => userId.toString() === senderId.toString()
  );

  if (!isUserInChat) {
    return res
      .status(403)
      .json({ message: "User is not a participant in this chat." });
  }

  const otherUserId = chat.users.find(
    (id) => id.toString() !== senderId.toString()
  );

  if (!otherUserId) {
    return res.status(404).json({ message: "Other user not found." });
  }

  // Socket Setup

  let messageData: any = {
    chatId,
    sender: senderId,
    seen: false,
    seenAt: undefined,
  };

  if (imageFile) {
    messageData.image = {
      url: imageFile.path,
      publicId: imageFile.filename,
    };
    messageData.text = text || "";
    messageData.messageType = "image";
  } else {
    messageData.text = text;
    messageData.messageType = "text";
  }

  const savedMessage = await Messages.create(messageData);

  const latestMessage = imageFile ? "📷 Image" : text;

  await Chat.findByIdAndUpdate(
    chatId,
    {
      latestMessage: {
        text: latestMessage,
        sender: senderId,
      },
      updatedAt: new Date(),
    },
    { new: true }
  );

  // Emit the message to the chat room and to the other user
  io.to(chatId).emit("message_received", { message: savedMessage });
  
  // Also send to other user's personal room if they're online
  const receiverSocketId = getReceiverSocketId(otherUserId.toString());
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("new_message_notification", { 
      message: savedMessage,
      chatId 
    });
  }

  res.status(201).json({ message: savedMessage, sender: senderId });
});

export const getMessagesByChat = TryCatch(async (req: AuthRequest, res) => {
  const userId = req.user?._id;

  const { chatId } = req.params;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!chatId) {
    return res.status(400).json({ message: "Chat ID is required." });
  }

  const chat = await Chat.findById(chatId);

  if (!chat) {
    return res.status(404).json({ message: "Chat not found." });
  }

  const isUserInChat = chat.users.some(
    (userId) => userId.toString() === userId.toString()
  );

  if (!isUserInChat) {
    return res
      .status(403)
      .json({ message: "User is not a participant in this chat." });
  }

  const messagesToMarkAsSeen = await Messages.find({
    chatId,
    sender: { $ne: userId },
    seen: false,
  });

  await Messages.updateMany(
    {
      chatId,
      sender: { $ne: userId },
      seen: false,
    },
    {
      $set: { seen: true, seenAt: new Date() },
    }
  ); 

  const messages = await Messages.find({ chatId }).sort({ createdAt: 1 });

  const otherUserId = chat.users.find((id) => id.toString() !== userId.toString());

  if (!otherUserId) {
    return res.status(404).json({ message: "Other user not found." });
  }

  try {
    const { data } = await axios.get(`${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`);
    
    //TODO: Socket Work

    res.json({
      messages,
      user: data
    })
  } catch (error) {
    console.log(`Error fetching user data for chat ${chatId}:`, error);

    res.json({
      _id: otherUserId,
      name: "Unknown user"
    })
  }

  // res.json({
  //   message: "Messages retrieved successfully.",
  //   messages,
  // });
})