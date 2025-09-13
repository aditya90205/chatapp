# Socket Implementation for Real-time Chat

This implementation adds real-time functionality to the chat application using Socket.IO.

## Features Implemented

### Backend Socket Server (`backend/chat/src/config/socket.ts`)

1. **User Connection Management**
   - Maps user IDs to socket IDs for direct messaging
   - Tracks online users and broadcasts updates
   - Automatically handles user disconnections

2. **Chat Room Management**
   - Users can join/leave chat rooms
   - Messages are broadcast to all participants in a room

3. **Real-time Events**
   - `join_chat`: Join a specific chat room
   - `leave_chat`: Leave a chat room
   - `new_message`: Send a message to chat participants
   - `typing`: Send typing indicators
   - `message_seen`: Mark messages as read

### Frontend Socket Context (`frontend/src/context/SocketContext.tsx`)

1. **Connection Management**
   - Connects automatically when user is authenticated
   - Passes user ID as query parameter for identification
   - Handles reconnection and cleanup

2. **Real-time Messaging**
   - Listens for incoming messages
   - Sends messages to other participants
   - Updates local state immediately for sender

3. **Typing Indicators**
   - Sends typing status when user types
   - Receives and displays typing indicators from others
   - Auto-clears after timeout

### Chat Page Integration (`frontend/src/app/chat/page.tsx`)

1. **Socket Event Listeners**
   - `message_received`: Updates message list with new messages
   - `user_typing`: Shows/hides typing indicators
   - `message_seen_update`: Updates message read status

2. **User Actions**
   - Joins chat room when selecting a conversation
   - Sends messages via both HTTP API and socket
   - Sends typing indicators while typing

## How It Works

1. **User Authentication**: When a user logs in, the socket connects with their user ID
2. **Online Status**: Server tracks online users and broadcasts the list to all clients
3. **Chat Selection**: When user selects a chat, they join that specific chat room
4. **Message Sending**: 
   - Message is saved via HTTP API
   - Socket broadcasts the message to chat room participants
   - Sender sees message immediately, receivers get it via socket
5. **Typing Indicators**: Sent in real-time when user types, with auto-clear timeout

## Usage Example

```typescript
// In a React component
const { socket, joinChat, sendMessage, sendTyping } = useSocketContext();

// Join a chat room
useEffect(() => {
  if (selectedChatId) {
    joinChat(selectedChatId);
  }
}, [selectedChatId]);

// Send a message
const handleSendMessage = (message) => {
  sendMessage(chatId, message);
};

// Send typing indicator
const handleTyping = (isTyping) => {
  sendTyping(chatId, isTyping, userId);
};
```

## Socket Events Reference

### Client to Server
- `join_chat(chatId)`: Join a chat room
- `leave_chat(chatId)`: Leave a chat room
- `new_message({ chatId, message })`: Send message to chat
- `typing({ chatId, isTyping, userId })`: Send typing status
- `message_seen({ chatId, messageId, userId })`: Mark message as seen

### Server to Client
- `getOnlineUsers(userIds[])`: List of currently online users
- `message_received({ message })`: New message received
- `user_typing({ isTyping, userId })`: Typing indicator
- `message_seen_update({ messageId, seenByUserId })`: Message read status