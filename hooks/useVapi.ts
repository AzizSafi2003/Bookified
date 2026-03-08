"use client";

import {
  endVoiceSession,
  startVoiceSession,
} from "@/lib/actions/session.actions";
import { ASSISTANT_ID, DEFAULT_VOICE, VOICE_SETTINGS } from "@/lib/constants";
import { IBook, Messages } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { getVoice } from "@/lib/utils";
import { useSubscription } from "./useSubscription";

export type CallStatus =
  | "idle"
  | "connecting"
  | "starting"
  | "listening"
  | "thinking"
  | "speaking";

// VAPI message types
type VapiMessageType =
  | "transcript"
  | "conversation-update"
  | "function-call"
  | "speech-update"
  | "metadata"
  | "hang"
  | "error";

interface VapiTranscriptMessage {
  type: "transcript";
  transcriptType: "partial" | "final";
  role: "user" | "assistant";
  transcript: string;
}

interface VapiConversationUpdateMessage {
  type: "conversation-update";
  conversation: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }>;
}

type VapiGenericMessage = {
  type: VapiMessageType | string;
};

type VapiMessage =
  | VapiTranscriptMessage
  | VapiConversationUpdateMessage
  | VapiGenericMessage;

interface VapiClient {
  on: (event: string, callback: (payload: unknown) => void) => void;
  off: (event: string, callback: (payload: unknown) => void) => void;
  start: (assistantId: string, options: unknown) => Promise<unknown>;
  stop: () => Promise<unknown>;
}

const isVapiMessage = (value: unknown): value is VapiMessage => {
  if (!value || typeof value !== "object") return false;
  return "type" in value;
};

const VAPI_API_KEY = process.env.NEXT_PUBLIC_VAPI_API_KEY;

// Module-level cache for Vapi instance (browser-only)
let vapi: VapiClient | null = null;

// Dynamically import Vapi only in browser environment
async function getVapi() {
  if (typeof window === "undefined") {
    throw new Error("Vapi can only be used in the browser");
  }

  if (!vapi) {
    if (!VAPI_API_KEY) {
      throw new Error("VAPI API key is not defined");
    }

    const { default: Vapi } = await import("@vapi-ai/web");
    vapi = new Vapi(VAPI_API_KEY) as unknown as VapiClient;
  }
  return vapi;
}

type TranscriptMessage = Messages & { timestamp: number };

export const useVapi = (book: IBook) => {
  const { userId } = useAuth();
  const router = useRouter();
  const { limits, isLoaded: isSubscriptionLoaded } = useSubscription();

  const [status, setStatus] = useState<CallStatus>("idle");
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [currentUserMessage, setCurrentUserMessage] = useState("");
  const [duration, setDuration] = useState(0);
  const [maxDurationMinutes, setMaxDurationMinutes] = useState(
    limits.maxDurationPerSession,
  );
  const [limitError, setLimitError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const isStoppingRef = useRef<boolean>(false);
  const hasLimitRedirectedRef = useRef<boolean>(false);

  const voice = book.persona || DEFAULT_VOICE;

  const isActive =
    status === "listening" ||
    status === "thinking" ||
    status === "speaking" ||
    status === "starting";

  useEffect(() => {
    if (!isSubscriptionLoaded) return;
    setMaxDurationMinutes(limits.maxDurationPerSession);
  }, [isSubscriptionLoaded, limits.maxDurationPerSession]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Check if this is an immediate consecutive duplicate (same role + content as last message)
  const isImmediateDuplicate = (
    prev: TranscriptMessage[],
    role: "user" | "assistant",
    content: string,
  ) => {
    const last = prev[prev.length - 1];
    return !!last && last.role === role && last.content === content;
  };

  // Handle transcript messages (partial and final)
  const handleTranscript = useCallback((message: VapiTranscriptMessage) => {
    const { transcriptType, role, transcript } = message;

    if (role === "user") {
      if (transcriptType === "partial") {
        // Update live user transcript
        setCurrentUserMessage(transcript);
        setStatus("listening");
      } else if (transcriptType === "final") {
        // User finished speaking - clear current and add to messages
        setCurrentUserMessage("");
        setStatus("thinking");

        setMessages((prev) => {
          // Only skip if this is an immediate consecutive duplicate
          const isDuplicate = isImmediateDuplicate(prev, "user", transcript);
          if (isDuplicate) return prev;

          return [
            ...prev,
            {
              role: "user",
              content: transcript,
              timestamp: Date.now(),
            },
          ];
        });
      }
    } else if (role === "assistant") {
      if (transcriptType === "partial") {
        // Update live assistant transcript
        setCurrentMessage(transcript);
        setStatus("speaking");
      } else if (transcriptType === "final") {
        // Assistant finished speaking - clear current and add to messages
        setCurrentMessage("");
        setStatus("listening");

        setMessages((prev) => {
          // Only skip if this is an immediate consecutive duplicate
          const isDuplicate = isImmediateDuplicate(
            prev,
            "assistant",
            transcript,
          );
          if (isDuplicate) return prev;

          return [
            ...prev,
            {
              role: "assistant",
              content: transcript,
              timestamp: Date.now(),
            },
          ];
        });
      }
    }
  }, []);

  // Handle conversation updates (full conversation history)
  const handleConversationUpdate = useCallback(
    (message: VapiConversationUpdateMessage) => {
      const { conversation } = message;

      // Only update if we have actual messages and aren't in the middle of streaming
      if (conversation.length > 0 && !currentMessage && !currentUserMessage) {
        const newMessages = conversation
          .filter((msg) => msg.role !== "system")
          .map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
            timestamp: Date.now(),
          }));

        setMessages(newMessages);
      }
    },
    [currentMessage, currentUserMessage],
  );

  // Main message handler
  const handleMessage = useCallback(
    (rawMessage: unknown) => {
      if (!isVapiMessage(rawMessage)) return;
      const message = rawMessage;

      switch (message.type) {
        case "transcript":
          handleTranscript(message as VapiTranscriptMessage);
          break;
        case "conversation-update":
          handleConversationUpdate(message as VapiConversationUpdateMessage);
          break;
        case "function-call":
          setStatus("thinking");
          break;
        default:
          // Handle other message types if needed
          break;
      }
    },
    [handleTranscript, handleConversationUpdate],
  );

  // Speech start/end handlers for status updates
  const handleSpeechStart = useCallback(() => {
    setStatus("speaking");
  }, []);

  const handleSpeechEnd = useCallback(() => {
    if (!isStoppingRef.current) {
      setStatus("listening");
    }
  }, []);

  // Call start handler
  const handleCallStart = useCallback(() => {
    hasLimitRedirectedRef.current = false;
    setDuration(0);
    setStatus("listening");
    clearTimer();
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  }, [clearTimer]);

  // Call end handler
  const handleCallEnd = useCallback(() => {
    if (sessionIdRef.current) {
      void endVoiceSession(sessionIdRef.current);
      sessionIdRef.current = null;
    }

    setStatus("idle");
    setCurrentMessage("");
    setCurrentUserMessage("");
    clearTimer();
    isStoppingRef.current = false;
  }, [clearTimer]);

  // Error handler
  const handleError = useCallback(
    (error: unknown) => {
      console.error("VAPI Error:", error);
      setLimitError("An error occurred during the call");
      setStatus("idle");
      clearTimer();
    },
    [clearTimer],
  );

  // Set up VAPI event listeners
  useEffect(() => {
    let isMounted = true;
    let vapiInstance: VapiClient | undefined;

    const setupVapi = async () => {
      try {
        vapiInstance = await getVapi();

        if (!isMounted) return;

        // Register event listeners
        vapiInstance.on("message", handleMessage);
        vapiInstance.on("speech-start", handleSpeechStart);
        vapiInstance.on("speech-end", handleSpeechEnd);
        vapiInstance.on("call-start", handleCallStart);
        vapiInstance.on("call-end", handleCallEnd);
        vapiInstance.on("error", handleError);
      } catch (error) {
        console.error("Failed to initialize Vapi:", error);
      }
    };

    setupVapi();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      if (vapiInstance) {
        vapiInstance.off("message", handleMessage);
        vapiInstance.off("speech-start", handleSpeechStart);
        vapiInstance.off("speech-end", handleSpeechEnd);
        vapiInstance.off("call-start", handleCallStart);
        vapiInstance.off("call-end", handleCallEnd);
        vapiInstance.off("error", handleError);
      }
    };
  }, [
    handleMessage,
    handleSpeechStart,
    handleSpeechEnd,
    handleCallStart,
    handleCallEnd,
    handleError,
  ]);

  useEffect(() => {
    if (!isActive || status === "starting") return;
    if (!sessionIdRef.current || isStoppingRef.current) return;
    if (hasLimitRedirectedRef.current) return;

    const maxDurationSeconds = maxDurationMinutes * 60;
    if (duration < maxDurationSeconds) return;

    hasLimitRedirectedRef.current = true;
    setLimitError(
      `Your session reached the ${maxDurationMinutes}-minute limit for your plan.`,
    );

    const enforceLimit = async () => {
      try {
        isStoppingRef.current = true;
        clearTimer();
        const vapiInstance = await getVapi();
        await vapiInstance.stop();

        if (sessionIdRef.current) {
          await endVoiceSession(sessionIdRef.current);
          sessionIdRef.current = null;
        }
      } finally {
        router.push("/");
      }
    };

    void enforceLimit();
  }, [clearTimer, duration, isActive, maxDurationMinutes, router, status]);

  const start = async () => {
    if (!userId) return setLimitError("Please login to start a conversation!");

    setLimitError(null);
    setStatus("connecting");
    setDuration(0);
    hasLimitRedirectedRef.current = false;

    try {
      const result = await startVoiceSession(book._id);

      if (!result.success) {
        setLimitError(
          result.error || "Session limit reached. Please upgrade your plan!",
        );
        setStatus("idle");
        return;
      }

      sessionIdRef.current = result.sessionId || null;
      setMaxDurationMinutes(
        result.maxDurationMinutes ?? limits.maxDurationPerSession,
      );
      setStatus("starting");

      const firstMessage = `Hey, good to meet you. Quick question before we dive in: have you ever read ${book.title} yet? Or are we are starting fresh?`;

      const vapiInstance = await getVapi();

      await vapiInstance.start(ASSISTANT_ID, {
        firstMessage,
        variableValues: {
          title: book.title,
          author: book.author,
          bookId: book._id,
        },
        voice: {
          provider: "11labs" as const,
          voiceId: getVoice(voice).id,
          model: "eleven_turbo_v2_5" as const,
          stability: VOICE_SETTINGS.stability,
          similarityBoost: VOICE_SETTINGS.similarityBoost,
          style: VOICE_SETTINGS.style,
          useSpeakerBoost: VOICE_SETTINGS.useSpeakerBoost,
        },
      });
    } catch (error) {
      if (sessionIdRef.current) {
        // FIXED: Only pass sessionId, no duration argument
        await endVoiceSession(sessionIdRef.current);
        sessionIdRef.current = null;
      }

      console.error("Error starting the call", error);
      setStatus("idle");
      setLimitError("An error occurred while starting the call!");
    }
  };

  const stop = async () => {
    isStoppingRef.current = true;
    clearTimer();
    try {
      const vapiInstance = await getVapi();
      await vapiInstance.stop();
    } finally {
      if (sessionIdRef.current) {
        // FIXED: Only pass sessionId, no duration argument
        await endVoiceSession(sessionIdRef.current);
        sessionIdRef.current = null;
      }
    }
  };

  const clearErrors = () => {
    setLimitError(null);
  };

  return {
    status,
    isActive,
    messages,
    currentMessage,
    currentUserMessage,
    duration,
    maxDurationMinutes,
    limitError,
    start,
    stop,
    clearErrors,
  };
};

export default useVapi;
