import { v } from "convex/values";
import { authMutation, authQuery } from "./functions";

// Generate upload URL for file storage
export const generateUploadUrl = authMutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Update user avatar
export const updateAvatar = authMutation({
  args: { storageId: v.id("_storage") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", ctx.user._id))
      .unique();

    if (profile) {
      // Delete old avatar if exists
      if (profile.avatarId) {
        await ctx.storage.delete(profile.avatarId);
      }
      await ctx.db.patch(profile._id, { avatarId: args.storageId });
    }
    return null;
  },
});

// Remove user avatar
export const removeAvatar = authMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", ctx.user._id))
      .unique();

    if (profile && profile.avatarId) {
      await ctx.storage.delete(profile.avatarId);
      await ctx.db.patch(profile._id, { avatarId: undefined });
    }
    return null;
  },
});

// Get file URL from storage ID
export const getFileUrl = authQuery({
  args: { storageId: v.id("_storage") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
