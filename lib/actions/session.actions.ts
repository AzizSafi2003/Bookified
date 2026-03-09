"use server";

import VoiceSession from "@/database/models/voice-session.model";
import { connectToDatabase } from "@/database/mongoose";
import { EndSessionResult, StartSessionResult } from "@/types";
import { getCurrentBillingPeriodStart } from "../subscription-constants";
import { auth } from "@clerk/nextjs/server";
import { getPlanLimits } from "../subscription.server";

export const startVoiceSession = async (
  bookId: string,
): Promise<StartSessionResult> => {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };
    await connectToDatabase();

    const limits = await getPlanLimits();
    const billingPeriodStart = getCurrentBillingPeriodStart();

    if (Number.isFinite(limits.maxSessionsPerMonth)) {
      const sessionsThisMonth = await VoiceSession.countDocuments({
        clerkId: userId,
        billingPeriodStart,
      });

      if (sessionsThisMonth >= limits.maxSessionsPerMonth) {
        return {
          success: false,
          error: "Monthly voice session limit reached. Please upgrade your plan.",
          isBillingError: true,
          maxDurationMinutes: limits.maxDurationPerSession,
        };
      }
    }

    const session = await VoiceSession.create({
      clerkId: userId,
      bookId,
      startedAt: new Date(),
      billingPeriodStart,
      durationSeconds: 0,
    });

    return {
      success: true,
      sessionId: session._id.toString(),
      maxDurationMinutes: limits.maxDurationPerSession,
    };
  } catch (error) {
    console.error("Error starting voice session:", error);
    return {
      success: false,
      error: "Failed to start voice session. PLease try again later!",
    };
  }
};

export const endVoiceSession = async (
  sessionId: string,
): Promise<EndSessionResult> => {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    await connectToDatabase();

    // Find the active session (not yet ended) to get startedAt
    const session = await VoiceSession.findOne({
      _id: sessionId,
      clerkId: userId,
      endedAt: { $exists: false },
    });

    if (!session) {
      return {
        success: false,
        error: "Voice session not found or already ended!",
      };
    }

    // Validate startedAt exists
    if (!session.startedAt) {
      return { success: false, error: "Invalid session: missing start time!" };
    }

    // Compute duration server-side
    const endedAt = new Date();
    const computedDurationSeconds = Math.max(
      0,
      Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000),
    );

    // Update with computed values
    const result = await VoiceSession.findOneAndUpdate(
      { _id: sessionId, clerkId: userId },
      { endedAt, durationSeconds: computedDurationSeconds },
    );

    if (!result) {
      return { success: false, error: "Voice session not found!" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error ending voice session", error);
    return {
      success: false,
      error: "Failed to end voice session. Please try again later!",
    };
  }
};
