import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

// Internal mutation to store verification code
export const storeVerificationCode = internalMutation({
  args: {
    userId: v.string(),
    phone: v.string(),
    code: v.string(),
    expiresAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Delete any existing verification for this user
    const existing = await ctx.db
      .query("phoneVerifications")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    for (const verification of existing) {
      await ctx.db.delete(verification._id);
    }

    // Insert new verification
    await ctx.db.insert("phoneVerifications", {
      userId: args.userId,
      phone: args.phone,
      code: args.code,
      expiresAt: args.expiresAt,
      verified: false,
    });

    return null;
  },
});

// Internal query to get verification code
export const getVerificationCode = internalQuery({
  args: { userId: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("phoneVerifications"),
      _creationTime: v.number(),
      userId: v.string(),
      phone: v.string(),
      code: v.string(),
      expiresAt: v.number(),
      verified: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const verification = await ctx.db
      .query("phoneVerifications")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();
    return verification;
  },
});

// Internal mutation to mark phone as verified
export const markPhoneVerified = internalMutation({
  args: {
    verificationId: v.id("phoneVerifications"),
    userId: v.string(),
    phone: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Update verification record
    await ctx.db.patch(args.verificationId, { verified: true });

    // Update user profile
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .unique();

    if (profile) {
      await ctx.db.patch(profile._id, {
        phone: args.phone,
        phoneVerified: true,
      });
    }

    return null;
  },
});
