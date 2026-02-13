import { v } from "convex/values";
import { authQuery, authMutation } from "./functions";

// Get or create a direct conversation
export const getOrCreateConversation = authMutation({
  args: { otherUserId: v.string() },
  returns: v.id("conversations"),
  handler: async (ctx, args) => {
    // Check if conversation exists
    const conversations = await ctx.db.query("conversations").collect();
    const existing = conversations.find(
      (c) =>
        c.participants.includes(ctx.user._id) &&
        c.participants.includes(args.otherUserId) &&
        c.participants.length === 2
    );

    if (existing) return existing._id;

    // Create new conversation
    return await ctx.db.insert("conversations", {
      participants: [ctx.user._id, args.otherUserId],
      lastMessageAt: Date.now(),
      lastMessagePreview: undefined,
    });
  },
});

// Get all conversations for current user
export const getMyConversations = authQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("conversations"),
      _creationTime: v.number(),
      participants: v.array(v.string()),
      lastMessageAt: v.number(),
      lastMessagePreview: v.optional(v.string()),
      otherUser: v.union(
        v.object({
          _id: v.id("userProfiles"),
          _creationTime: v.number(),
          userId: v.string(),
          name: v.string(),
          email: v.optional(v.string()),
          phone: v.optional(v.string()),
          username: v.optional(v.string()),
          bio: v.optional(v.string()),
          avatarId: v.optional(v.id("_storage")),
          lastSeen: v.number(),
          isOnline: v.boolean(),
        }),
        v.null()
      ),
      unreadCount: v.number(),
    })
  ),
  handler: async (ctx) => {
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_last_message")
      .order("desc")
      .collect();

    const myConversations = conversations.filter((c) =>
      c.participants.includes(ctx.user._id)
    );

    const result = await Promise.all(
      myConversations.map(async (conv) => {
        const otherUserId = conv.participants.find((p) => p !== ctx.user._id);
        const otherUser = otherUserId
          ? await ctx.db
              .query("userProfiles")
              .withIndex("by_user_id", (q) => q.eq("userId", otherUserId))
              .unique()
          : null;

        return {
          ...conv,
          otherUser,
          unreadCount: 0, // Simplified for now
        };
      })
    );

    return result;
  },
});

// Create a group
export const createGroup = authMutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    memberIds: v.array(v.string()),
  },
  returns: v.id("groups"),
  handler: async (ctx, args) => {
    const allMembers = [ctx.user._id, ...args.memberIds];

    return await ctx.db.insert("groups", {
      name: args.name,
      description: args.description,
      avatarId: undefined,
      creatorId: ctx.user._id,
      admins: [ctx.user._id],
      members: allMembers,
      lastMessageAt: Date.now(),
      lastMessagePreview: undefined,
    });
  },
});

// Get my groups
export const getMyGroups = authQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("groups"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.optional(v.string()),
      avatarId: v.optional(v.id("_storage")),
      creatorId: v.string(),
      admins: v.array(v.string()),
      members: v.array(v.string()),
      lastMessageAt: v.number(),
      lastMessagePreview: v.optional(v.string()),
      memberCount: v.number(),
    })
  ),
  handler: async (ctx) => {
    const groups = await ctx.db
      .query("groups")
      .withIndex("by_last_message")
      .order("desc")
      .collect();

    const myGroups = groups.filter((g) => g.members.includes(ctx.user._id));

    return myGroups.map((g) => ({
      ...g,
      memberCount: g.members.length,
    }));
  },
});

// Get group details
export const getGroup = authQuery({
  args: { groupId: v.id("groups") },
  returns: v.union(
    v.object({
      _id: v.id("groups"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.optional(v.string()),
      avatarId: v.optional(v.id("_storage")),
      creatorId: v.string(),
      admins: v.array(v.string()),
      members: v.array(v.string()),
      lastMessageAt: v.number(),
      lastMessagePreview: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group || !group.members.includes(ctx.user._id)) return null;
    return group;
  },
});

// Add member to group
export const addGroupMember = authMutation({
  args: { groupId: v.id("groups"), userId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group || !group.admins.includes(ctx.user._id)) return null;

    if (!group.members.includes(args.userId)) {
      await ctx.db.patch(args.groupId, {
        members: [...group.members, args.userId],
      });
    }
    return null;
  },
});

// Leave group
export const leaveGroup = authMutation({
  args: { groupId: v.id("groups") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) return null;

    const newMembers = group.members.filter((m) => m !== ctx.user._id);
    const newAdmins = group.admins.filter((a) => a !== ctx.user._id);

    if (newMembers.length === 0) {
      await ctx.db.delete(args.groupId);
    } else {
      await ctx.db.patch(args.groupId, {
        members: newMembers,
        admins: newAdmins.length > 0 ? newAdmins : [newMembers[0]],
      });
    }
    return null;
  },
});

// Create a channel
export const createChannel = authMutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    username: v.string(),
    isPublic: v.boolean(),
  },
  returns: v.union(v.id("channels"), v.null()),
  handler: async (ctx, args) => {
    // Check if username is taken
    const existing = await ctx.db
      .query("channels")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (existing) return null;

    const channelId = await ctx.db.insert("channels", {
      name: args.name,
      description: args.description,
      username: args.username,
      avatarId: undefined,
      creatorId: ctx.user._id,
      admins: [ctx.user._id],
      subscriberCount: 1,
      lastMessageAt: Date.now(),
      lastMessagePreview: undefined,
      isPublic: args.isPublic,
    });

    // Subscribe creator
    await ctx.db.insert("channelSubscriptions", {
      channelId,
      userId: ctx.user._id,
    });

    return channelId;
  },
});

// Get my channels (subscribed)
export const getMyChannels = authQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("channels"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.optional(v.string()),
      username: v.string(),
      avatarId: v.optional(v.id("_storage")),
      creatorId: v.string(),
      admins: v.array(v.string()),
      subscriberCount: v.number(),
      lastMessageAt: v.number(),
      lastMessagePreview: v.optional(v.string()),
      isPublic: v.boolean(),
      isAdmin: v.boolean(),
    })
  ),
  handler: async (ctx) => {
    const subscriptions = await ctx.db
      .query("channelSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .collect();

    const channels = await Promise.all(
      subscriptions.map(async (sub) => {
        const channel = await ctx.db.get(sub.channelId);
        return channel;
      })
    );

    return channels
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .map((c) => ({
        ...c,
        isAdmin: c.admins.includes(ctx.user._id),
      }))
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  },
});

// Get channel details
export const getChannel = authQuery({
  args: { channelId: v.id("channels") },
  returns: v.union(
    v.object({
      _id: v.id("channels"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.optional(v.string()),
      username: v.string(),
      avatarId: v.optional(v.id("_storage")),
      creatorId: v.string(),
      admins: v.array(v.string()),
      subscriberCount: v.number(),
      lastMessageAt: v.number(),
      lastMessagePreview: v.optional(v.string()),
      isPublic: v.boolean(),
      isSubscribed: v.boolean(),
      isAdmin: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const channel = await ctx.db.get(args.channelId);
    if (!channel) return null;

    const subscription = await ctx.db
      .query("channelSubscriptions")
      .withIndex("by_user_and_channel", (q) =>
        q.eq("userId", ctx.user._id).eq("channelId", args.channelId)
      )
      .unique();

    return {
      ...channel,
      isSubscribed: !!subscription,
      isAdmin: channel.admins.includes(ctx.user._id),
    };
  },
});

// Subscribe to channel
export const subscribeToChannel = authMutation({
  args: { channelId: v.id("channels") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("channelSubscriptions")
      .withIndex("by_user_and_channel", (q) =>
        q.eq("userId", ctx.user._id).eq("channelId", args.channelId)
      )
      .unique();

    if (!existing) {
      await ctx.db.insert("channelSubscriptions", {
        channelId: args.channelId,
        userId: ctx.user._id,
      });

      const channel = await ctx.db.get(args.channelId);
      if (channel) {
        await ctx.db.patch(args.channelId, {
          subscriberCount: channel.subscriberCount + 1,
        });
      }
    }
    return null;
  },
});

// Unsubscribe from channel
export const unsubscribeFromChannel = authMutation({
  args: { channelId: v.id("channels") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("channelSubscriptions")
      .withIndex("by_user_and_channel", (q) =>
        q.eq("userId", ctx.user._id).eq("channelId", args.channelId)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);

      const channel = await ctx.db.get(args.channelId);
      if (channel) {
        await ctx.db.patch(args.channelId, {
          subscriberCount: Math.max(0, channel.subscriberCount - 1),
        });
      }
    }
    return null;
  },
});

// Search public channels
export const searchChannels = authQuery({
  args: { query: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("channels"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.optional(v.string()),
      username: v.string(),
      avatarId: v.optional(v.id("_storage")),
      creatorId: v.string(),
      admins: v.array(v.string()),
      subscriberCount: v.number(),
      lastMessageAt: v.number(),
      lastMessagePreview: v.optional(v.string()),
      isPublic: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    if (!args.query.trim()) return [];

    const channels = await ctx.db.query("channels").collect();
    const searchLower = args.query.toLowerCase();

    return channels
      .filter(
        (c) =>
          c.isPublic &&
          (c.name.toLowerCase().includes(searchLower) ||
            c.username.toLowerCase().includes(searchLower))
      )
      .slice(0, 20);
  },
});
