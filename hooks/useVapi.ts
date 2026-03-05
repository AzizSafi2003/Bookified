import { startVoiceSession } from "@/lib/actions/session.actions";
import { ASSISTANT_ID, DEFAULT_VOICE, VOICE_SETTINGS } from "@/lib/constants";
import { IBook, Messages } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";
import { getVoice } from "@/lib/utils";

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

type VapiMessage = VapiTranscriptMessage | VapiConversationUpdateMessage;

const useLatestRef = <T>(value: T) => {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
};

const VAPI_API_KEY = process.env.NEXT_PUBLIC_VAPI_API_KEY;

let vapi: InstanceType<typeof Vapi>;

function getVapi() {
  if (!vapi) {
    if (!VAPI_API_KEY) {
      throw new Error("VAPI API key is not defined");
    }
    vapi = new Vapi(VAPI_API_KEY);
  }
  return vapi;
}

export const useVapi = (book: IBook) => {
  const { userId } = useAuth();

  const [status, setStatus] = useState<CallStatus>("idle");
  const [messages, setMessages] = useState<Messages[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [currentUserMessage, setCurrentUserMessage] = useState("");
  const [duration, setDuration] = useState(0);
  const [limitError, setLimitError] = useState<String | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const isStoppingRef = useRef<boolean>(false);

  // Track processed final messages to prevent duplicates
  const processedFinalMessages = useRef<Set<string>>(new Set());

  const bookRef = useLatestRef(book);
  const durationRef = useLatestRef(duration);
  const voice = book.persona || DEFAULT_VOICE;

  const isActive =
    status === "listening" ||
    status === "thinking" ||
    status === "speaking" ||
    status === "starting";

  // Helper to generate unique key for deduplication
  const getMessageKey = useCallback(
    (role: string, content: string, timestamp?: number) => {
      return `${role}-${content}-${timestamp || Date.now()}`;
    },
    [],
  );

  // Handle transcript messages (partial and final)
  const handleTranscript = useCallback(
    (message: VapiTranscriptMessage) => {
      const { transcriptType, role, transcript } = message;

      if (role === "user") {
        if (transcriptType === "partial") {
          // Update live user transcript
          setCurrentUserMessage(transcript);
          setStatus("listening");
        } else if (transcriptType === "final") {
          // User finished speaking - clear current and add to messages
          const messageKey = getMessageKey("user", transcript);

          // Deduplicate: only add if we haven't seen this final transcript
          if (!processedFinalMessages.current.has(messageKey)) {
            processedFinalMessages.current.add(messageKey);

            setCurrentUserMessage("");
            setStatus("thinking");

            setMessages((prev) => {
              // Extra deduplication check on the array level
              const isDuplicate = prev.some(
                (msg) => msg.role === "user" && msg.content === transcript,
              );
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
        }
      } else if (role === "assistant") {
        if (transcriptType === "partial") {
          // Update live assistant transcript
          setCurrentMessage(transcript);
          setStatus("speaking");
        } else if (transcriptType === "final") {
          // Assistant finished speaking - clear current and add to messages
          const messageKey = getMessageKey("assistant", transcript);

          // Deduplicate: only add if we haven't seen this final transcript
          if (!processedFinalMessages.current.has(messageKey)) {
            processedFinalMessages.current.add(messageKey);

            setCurrentMessage("");

            setMessages((prev) => {
              // Extra deduplication check on the array level
              const isDuplicate = prev.some(
                (msg) => msg.role === "assistant" && msg.content === transcript,
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
      }
    },
    [getMessageKey],
  );

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
    (message: VapiMessage) => {
      switch (message.type) {
        case "transcript":
          handleTranscript(message);
          break;
        case "conversation-update":
          handleConversationUpdate(message);
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
    // Status will be updated by transcript final or other events
  }, []);

  // Call start handler
  const handleCallStart = useCallback(() => {
    setStatus("listening");
    processedFinalMessages.current.clear(); // Reset deduplication on new call
  }, []);

  // Call end handler
  const handleCallEnd = useCallback(() => {
    setStatus("idle");
    setCurrentMessage("");
    setCurrentUserMessage("");

    // Clear any pending timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (startTimerRef.current) {
      clearTimeout(startTimerRef.current);
      startTimerRef.current = null;
    }

    isStoppingRef.current = false;
  }, []);

  // Error handler
  const handleError = useCallback((error: any) => {
    console.error("VAPI Error:", error);
    setLimitError("An error occurred during the call");
    setStatus("idle");
  }, []);

  // Set up VAPI event listeners
  useEffect(() => {
    const vapiInstance = getVapi();

    // Register event listeners
    vapiInstance.on("message", handleMessage);
    vapiInstance.on("speech-start", handleSpeechStart);
    vapiInstance.on("speech-end", handleSpeechEnd);
    vapiInstance.on("call-start", handleCallStart);
    vapiInstance.on("call-end", handleCallEnd);
    vapiInstance.on("error", handleError);

    // Cleanup on unmount
    return () => {
      vapiInstance.off("message", handleMessage);
      vapiInstance.off("speech-start", handleSpeechStart);
      vapiInstance.off("speech-end", handleSpeechEnd);
      vapiInstance.off("call-start", handleCallStart);
      vapiInstance.off("call-end", handleCallEnd);
      vapiInstance.off("error", handleError);
    };
  }, [
    handleMessage,
    handleSpeechStart,
    handleSpeechEnd,
    handleCallStart,
    handleCallEnd,
    handleError,
  ]);

  const start = async () => {
    if (!userId) return setLimitError("Please login to start a conversation!");

    setLimitError(null);
    setStatus("connecting");
    processedFinalMessages.current.clear();

    try {
      const result = await startVoiceSession(userId, book._id);

      if (!result.success) {
        setLimitError(
          result.error || "Session limit reached. Please upgrade your plan!",
        );
        setStatus("idle");
        return;
      }

      sessionIdRef.current = result.sessionId || null;

      const firstMessage = `Hey, good to meet you. Quick question before we dive in: have you ever read ${book.title} yet? Or are we are starting fresh?`;

      await getVapi().start(ASSISTANT_ID, {
        firstMessage,
        variableValues: {
          title: book.title,
          author: book.author,
          bookId: book._id,
        },
      });
    } catch (error) {
      console.error("Error starting the call", error);
      setStatus("idle");
      setLimitError("An error occurred while starting the call!");
    }
  };

  const stop = async () => {
    isStoppingRef.current = true;
    await getVapi().stop();
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
    start,
    stop,
    clearErrors,
  };
};

export default useVapi;
