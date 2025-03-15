import mongoose, { Schema, Document } from 'mongoose';

export interface IChat extends Document {
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema: Schema = new Schema({
  participants: {
    type: [String],
    required: true,
    index: true
  },
  lastMessage: {
    type: String
  },
  lastMessageTime: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for efficient querying
ChatSchema.index({ participants: 1 });
ChatSchema.index({ updatedAt: -1 });

// Ensure that the chat ID is unique for a pair of users
ChatSchema.pre('save', function(next) {
  // Sort participants to ensure consistent chat IDs regardless of order
  this.participants.sort();
  next();
});

export const Chat = mongoose.model<IChat>('Chat', ChatSchema); 