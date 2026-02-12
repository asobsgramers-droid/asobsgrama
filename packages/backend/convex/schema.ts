import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User profiles (linked to Better Auth users)
  userProfiles: defineTable({
    userId: v.string(), // Better Auth user ID
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    phoneVerified: v.optional(v.boolean()),
    username: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarId: v.optional(v.id("_storage")),
    lastSeen: v.number(),
    isOnline: v.boolean(),
  })
    .index("by_user_id", ["userId"])
    .index("by_username", ["username"])
    .index("by_phone", ["phone"]),

  // Phone verification codes
  phoneVerifications: defineTable({
    userId: v.string(),
    phone: v.string(),
    code: v.string(),
    expiresAt: v.number(),
    verified: v.boolean(),
  })
    .index("by_user_id", ["userId"])
    .index("by_phone", ["phone"]),

  // Blocked users
  blockedUsers: defineTable({
    userId: v.string(), // User who blocked
    blockedUserId: v.string(), // User who is blocked
  })
    .index("by_user_id", ["userId"])
    .index("by_blocked_user", ["blockedUserId"])
    .index("by_user_and_blocked", ["userId", "blockedUserId"]),

  // Direct message conversations
  conversations: defineTable({
    participants: v.array(v.string()), // Array of 2 user IDs
    lastMessageAt: v.number(),
    lastMessagePreview: v.optional(v.string()),
  }).index("by_last_message", ["lastMessageAt"]),

  // Group chats
  groups: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    avatarId: v.optional(v.id("_storage")),
    creatorId: v.string(),
    admins: v.array(v.string()),
    members: v.array(v.string()),
    lastMessageAt: v.number(),
    lastMessagePreview: v.optional(v.string()),
  }).index("by_last_message", ["lastMessageAt"]),

  // Channels (broadcast only by admins)
  channels: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    username: v.string(), // @channelname
    avatarId: v.optional(v.id("_storage")),
    creatorId: v.string(),
    admins: v.array(v.string()),
    subscriberCount: v.number(),
    lastMessageAt: v.number(),
    lastMessagePreview: v.optional(v.string()),
    isPublic: v.boolean(),
  })
    .index("by_username", ["username"])
    .index("by_last_message", ["lastMessageAt"]),

  // Channel subscriptions
  channelSubscriptions: defineTable({
    channelId: v.id("channels"),
    userId: v.string(),
  })
    .index("by_channel", ["channelId"])
    .index("by_user", ["userId"])
    .index("by_user_and_channel", ["userId", "channelId"]),

  // Messages (for all chat types)
  messages: defineTable({
    chatType: v.union(
      v.literal("direct"),
      v.literal("group"),
      v.literal("channel")
    ),
    chatId: v.string(), // conversation ID, group ID, or channel ID
    senderId: v.string(),
    senderName: v.string(),
    content: v.string(),
    imageId: v.optional(v.id("_storage")),
    replyToId: v.optional(v.id("messages")),
    isEdited: v.boolean(),
    isDeleted: v.boolean(),
  })
    .index("by_chat", ["chatType", "chatId"])
    .index("by_sender", ["senderId"]),
});
