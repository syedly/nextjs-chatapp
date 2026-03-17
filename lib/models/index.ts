/**
 * lib/models/index.ts
 * All Mongoose models for the application.
 * Prevents model re-registration during hot-reloads.
 */

import mongoose, { Document, Schema } from "mongoose";

// ─────────────────────────────────────────────
// USER MODEL (custom auth: email + password)
// ─────────────────────────────────────────────

export interface IUser extends Document {
  email: string;
  password: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String },
  },
  { timestamps: true }
);

export const User =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

// ─────────────────────────────────────────────
// CHAT MODEL
// ─────────────────────────────────────────────

export interface IChat extends Document {
  userId: string; // User._id
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<IChat>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, default: "New Chat" },
  },
  { timestamps: true }
);

export const Chat =
  mongoose.models.Chat || mongoose.model<IChat>("Chat", ChatSchema);

// ─────────────────────────────────────────────
// MESSAGE MODEL
// ─────────────────────────────────────────────

export interface IMessage extends Document {
  chatId: mongoose.Types.ObjectId | string;
  role: "user" | "assistant" | "system";
  content: string;
  toolCalls?: Array<{
    tool: string;
    input: string;
    output: string;
  }>;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    chatId: { type: Schema.Types.ObjectId, ref: "Chat", required: true, index: true },
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    content: { type: String, required: true },
    toolCalls: [
      {
        tool: String,
        input: String,
        output: String,
      },
    ],
  },
  { timestamps: true }
);

export const Message =
  mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);

// ─────────────────────────────────────────────
// CUSTOMER MODEL (for the DB query tool demo)
// ─────────────────────────────────────────────

export interface ICustomer extends Document {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: "active" | "inactive" | "lead";
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    company: { type: String },
    status: {
      type: String,
      enum: ["active", "inactive", "lead"],
      default: "lead",
    },
  },
  { timestamps: true }
);

export const Customer =
  mongoose.models.Customer ||
  mongoose.model<ICustomer>("Customer", CustomerSchema);
