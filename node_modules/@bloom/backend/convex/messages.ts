import { v } from "convex/values";
import { authQuery, authMutation } from "./functions";

const messageValidator = v.object({
  _id: v.id("messages"),
  _creationTime: v.number(),
  chatType: v.union(
    v.literal("direct"),
    v.literal("group"),
    v.literal("channel")
  ),
  chatId: v.string(),
  senderId: v.string(),
  senderName: v.string(),
  content: v.string(),
  imageId: v.optional(v.id("_storage")),
  replyToId: v.optional(v.id("messages")),
  isEdited: v.boolean(),
  isDeleted: v.boolean(),
});

// Send a message
export const sendMessage = authMutation({
  args: {
    chatType: v.union(
      v.literal("direct"),
      v.literal("group"),
      v.literal("channel")
    ),
    chatId: v.string(),
    content: v.string(),
    replyToId: v.optional(v.id("messages")),
  },
  returns: v.id("messages"),
  handler: async (ctx, args) => {
    // Get sender profile
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", ctx.user._id))
      .unique();

    const senderName = profile?.name || "Unknown";
    const preview =
      args.content.length > 50
        ? args.content.substring(0, 50) + "..."
        : args.content;

    // Insert message
    const messageId = await ctx.db.insert("messages", {
      chatType: args.chatType,
      chatId: args.chatId,
      senderId: ctx.user._id,
      senderName,
      content: args.content,
      imageId: undefined,
      replyToId: args.replyToId,
      isEdited: false,
      isDeleted: false,
    });

    // Update last message on chat
    if (args.chatType === "direct") {
      const convId = ctx.db.normalizeId("conversations", args.chatId);
      if (convId) {
        await ctx.db.patch(convId, {
          lastMessageAt: Date.now(),
          lastMessagePreview: preview,
        });
      }
    } else if (args.chatType === "group") {
      const groupId = ctx.db.normalizeId("groups", args.chatId);
      if (groupId) {
        await ctx.db.patch(groupId, {
          lastMessageAt: Date.now(),
          lastMessagePreview: preview,
        });
      }
    } else if (args.chatType === "channel") {
      const channelId = ctx.db.normalizeId("channels", args.chatId);
      if (channelId) {
        await ctx.db.patch(channelId, {
          lastMessageAt: Date.now(),
          lastMessagePreview: preview,
        });
      }
    }

    return messageId;
  },
});

// Get messages for a chat
export const getMessages = authQuery({
  args: {
    chatType: v.union(
      v.literal("direct"),
      v.literal("group"),
      v.literal("channel")
    ),
    chatId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(messageValidator),
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) =>
        q.eq("chatType", args.chatType).eq("chatId", args.chatId)
      )
      .order("desc")
      .take(limit);

    return messages.reverse();
  },
});

// Edit a message
export const editMessage = authMutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message || message.senderId !== ctx.user._id) return null;

    await ctx.db.patch(args.messageId, {
      content: args.content,
      isEdited: true,
    });

    return null;
  },
});

// Delete a message
export const deleteMessage = authMutation({
  args: { messageId: v.id("messages") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message || message.senderId !== ctx.user._id) return null;

    await ctx.db.patch(args.messageId, {
      isDeleted: true,
      content: "This message was deleted",
    });

    return null;
  },
});

// Get a single message (for replies)
export const getMessage = authQuery({
  args: { messageId: v.id("messages") },
  returns: v.union(messageValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.messageId);
  },
});
