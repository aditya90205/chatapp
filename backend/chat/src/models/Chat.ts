import mongoose, { Document, Schema } from "mongoose";

interface IChat extends Document {
  users: string[];
  latestMessage: {
    text: string;
    sender: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema: Schema = new Schema(
  {
    users: [{ type: String, required: true }],
    latestMessage: {
      text: { type: String },
      sender: { type: String },
    },
  },
  { timestamps: true }
);

const Chat = mongoose.model<IChat>("Chat", ChatSchema);

export default Chat;
