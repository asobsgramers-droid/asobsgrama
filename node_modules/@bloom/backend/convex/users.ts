import { v } from "convex/values";
import { authQuery, authMutation } from "./functions";

// Profile validator - reusable
const profileValidator = v.object({
  _id: v.id("userProfiles"),
  _creationTime: v.number(),
  userId: v.string(),
  name: v.string(),
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  phoneVerified: v.optional(v.boolean()),
  username: v.optional(v.string()),
  bio: v.optional(v.string()),
  avatarId: v.optional(v.id("_storage")),
  lastSeen: v.number(),
  isOnline: v.boolean(),
});

// Get current user's profile
export const getCurrentProfile = authQuery({
  args: {},
  returns: v.union(profileValidator, v.null()),
  handler: async (ctx) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", ctx.user._id))
      .unique();
    return profile;
  },
});

// Get current profile with avatar URL
export const getCurrentProfileWithAvatar = authQuery({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("userProfiles"),
      _creationTime: v.number(),
      userId: v.string(),
      name: v.string(),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      phoneVerified: v.optional(v.boolean()),
      username: v.optional(v.string()),
      bio: v.optional(v.string()),
      avatarId: v.optional(v.id("_storage")),
      avatarUrl: v.union(v.string(), v.null()),
      lastSeen: v.number(),
      isOnline: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", ctx.user._id))
      .unique();
    
    if (!profile) return null;
    
    let avatarUrl: string | null = null;
    if (profile.avatarId) {
      avatarUrl = await ctx.storage.getUrl(profile.avatarId);
    }
    
    return { ...profile, avatarUrl };
  },
});

// Create or update user profile
export const createOrUpdateProfile = authMutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    username: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  returns: v.id("userProfiles"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", ctx.user._id))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        lastSeen: Date.now(),
        isOnline: true,
      });
      return existing._id;
    }

    return await ctx.db.insert("userProfiles", {
      userId: ctx.user._id,
      ...args,
      phoneVerified: false,
      lastSeen: Date.now(),
      isOnline: true,
    });
  },
});

// Update online status
export const updateOnlineStatus = authMutation({
  args: { isOnline: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", ctx.user._id))
      .unique();

    if (profile) {
      await ctx.db.patch(profile._id, {
        isOnline: args.isOnline,
        lastSeen: Date.now(),
      });
    }
    return null;
  },
});

// Search users by username or name
export const searchUsers = authQuery({
  args: { query: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("userProfiles"),
      _creationTime: v.number(),
      userId: v.string(),
      name: v.string(),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      phoneVerified: v.optional(v.boolean()),
      username: v.optional(v.string()),
      bio: v.optional(v.string()),
      avatarId: v.optional(v.id("_storage")),
      avatarUrl: v.union(v.string(), v.null()),
      lastSeen: v.number(),
      isOnline: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    if (!args.query.trim()) return [];

    const allUsers = await ctx.db.query("userProfiles").collect();
    const searchLower = args.query.toLowerCase();

    const filtered = allUsers
      .filter(
        (u) =>
          u.userId !== ctx.user._id &&
          (u.name.toLowerCase().includes(searchLower) ||
            u.username?.toLowerCase().includes(searchLower))
      )
      .slice(0, 20);

    // Add avatar URLs
    const results = await Promise.all(
      filtered.map(async (u) => {
        let avatarUrl: string | null = null;
        if (u.avatarId) {
          avatarUrl = await ctx.storage.getUrl(u.avatarId);
        }
        return { ...u, avatarUrl };
      })
    );

    return results;
  },
});

// Get user profile by ID
export const getProfileById = authQuery({
  args: { userId: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("userProfiles"),
      _creationTime: v.number(),
      userId: v.string(),
      name: v.string(),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      phoneVerified: v.optional(v.boolean()),
      username: v.optional(v.string()),
      bio: v.optional(v.string()),
      avatarId: v.optional(v.id("_storage")),
      avatarUrl: v.union(v.string(), v.null()),
      lastSeen: v.number(),
      isOnline: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .unique();
    
    if (!profile) return null;
    
    let avatarUrl: string | null = null;
    if (profile.avatarId) {
      avatarUrl = await ctx.storage.getUrl(profile.avatarId);
    }
    
    return { ...profile, avatarUrl };
  },
});

// Block a user
export const blockUser = authMutation({
  args: { blockedUserId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("blockedUsers")
      .withIndex("by_user_and_blocked", (q) =>
        q.eq("userId", ctx.user._id).eq("blockedUserId", args.blockedUserId)
      )
      .unique();

    if (!existing) {
      await ctx.db.insert("blockedUsers", {
        userId: ctx.user._id,
        blockedUserId: args.blockedUserId,
      });
    }
    return null;
  },
});

// Unblock a user
export const unblockUser = authMutation({
  args: { blockedUserId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("blockedUsers")
      .withIndex("by_user_and_blocked", (q) =>
        q.eq("userId", ctx.user._id).eq("blockedUserId", args.blockedUserId)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});

// Get blocked users
export const getBlockedUsers = authQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("blockedUsers"),
      userId: v.string(),
      blockedUserId: v.string(),
      profile: v.union(
        v.object({
          _id: v.id("userProfiles"),
          _creationTime: v.number(),
          userId: v.string(),
          name: v.string(),
          email: v.optional(v.string()),
          phone: v.optional(v.string()),
          phoneVerified: v.optional(v.boolean()),
          username: v.optional(v.string()),
          bio: v.optional(v.string()),
          avatarId: v.optional(v.id("_storage")),
          avatarUrl: v.union(v.string(), v.null()),
          lastSeen: v.number(),
          isOnline: v.boolean(),
        }),
        v.null()
      ),
    })
  ),
  handler: async (ctx) => {
    const blocked = await ctx.db
      .query("blockedUsers")
      .withIndex("by_user_id", (q) => q.eq("userId", ctx.user._id))
      .collect();

    const result = await Promise.all(
      blocked.map(async (b) => {
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user_id", (q) => q.eq("userId", b.blockedUserId))
          .unique();
        
        if (!profile) {
          return { ...b, profile: null };
        }
        
        let avatarUrl: string | null = null;
        if (profile.avatarId) {
          avatarUrl = await ctx.storage.getUrl(profile.avatarId);
        }
        
        return { ...b, profile: { ...profile, avatarUrl } };
      })
    );

    return result;
  },
});

// Check if a user is blocked
export const isUserBlocked = authQuery({
  args: { userId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const blocked = await ctx.db
      .query("blockedUsers")
      .withIndex("by_user_and_blocked", (q) =>
        q.eq("userId", ctx.user._id).eq("blockedUserId", args.userId)
      )
      .unique();
    return !!blocked;
  },
});
