"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import Twilio from "twilio";

// Generate a 6-digit verification code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send verification code via Twilio
export const sendVerificationCode = action({
  args: {
    userId: v.string(),
    phone: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      // For development/testing without Twilio credentials
      const code = generateCode();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      await ctx.runMutation(internal.phoneVerificationHelpers.storeVerificationCode, {
        userId: args.userId,
        phone: args.phone,
        code,
        expiresAt,
      });

      return {
        success: true,
        message: `Development mode: Your code is ${code}`,
      };
    }

    try {
      const client = Twilio(accountSid, authToken);
      const code = generateCode();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      // Store the code
      await ctx.runMutation(internal.phoneVerificationHelpers.storeVerificationCode, {
        userId: args.userId,
        phone: args.phone,
        code,
        expiresAt,
      });

      // Send SMS via Twilio
      await client.messages.create({
        body: `Your AsobsGram verification code is: ${code}. This code expires in 10 minutes.`,
        from: twilioPhoneNumber,
        to: args.phone,
      });

      return {
        success: true,
        message: "Verification code sent successfully",
      };
    } catch (error) {
      console.error("Twilio error:", error);
      return {
        success: false,
        message: "Failed to send verification code. Please try again.",
      };
    }
  },
});

// Verify the code
export const verifyCode = action({
  args: {
    userId: v.string(),
    code: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const verification = await ctx.runQuery(
      internal.phoneVerificationHelpers.getVerificationCode,
      { userId: args.userId }
    );

    if (!verification) {
      return {
        success: false,
        message: "No verification code found. Please request a new code.",
      };
    }

    if (verification.expiresAt < Date.now()) {
      return {
        success: false,
        message: "Verification code has expired. Please request a new code.",
      };
    }

    if (verification.code !== args.code) {
      return {
        success: false,
        message: "Invalid verification code. Please try again.",
      };
    }

    // Mark phone as verified
    await ctx.runMutation(internal.phoneVerificationHelpers.markPhoneVerified, {
      verificationId: verification._id,
      userId: args.userId,
      phone: verification.phone,
    });

    return {
      success: true,
      message: "Phone number verified successfully!",
    };
  },
});
