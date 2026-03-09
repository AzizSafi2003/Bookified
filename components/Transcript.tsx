"use client";

import { useEffect, useRef } from "react";
import { Mic } from "lucide-react";
import { Messages } from "@/types";

interface TranscriptProps {
  messages: Messages[];
  currentMessage: string;
  currentUserMessage: string;
}

const Transcript = ({
  messages,
  currentMessage,
  currentUserMessage,
}: TranscriptProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentMessage, currentUserMessage]);

  const isEmpty =
    messages.length === 0 && !currentMessage && !currentUserMessage;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] text-center flex-1">
        <Mic className="size-12 text-[#212a3b] mb-4" />
        <h2 className="text-[var(--text-primary)] text-lg font-bold">
          <b>No conversation yet</b>
        </h2>
        <p className="text-[var(--text-muted)] text-sm mt-1">
          Click the mic button above to start talking
        </p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 flex-1 overflow-y-auto pr-2 scroll-smooth [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#d4c4a8] [&::-webkit-scrollbar-thumb]:rounded-[3px] hover:[&::-webkit-scrollbar-thumb]:bg-[#c4b498]"
    >
      {messages.map((message, index) => (
        <div
          key={index}
          className={`animate-in fade-in slide-in-from-bottom-2 duration-300 ${
            message.role === "user"
              ? "flex justify-end"
              : "flex justify-start"
          }`}
        >
          <div
            className={`max-w-[80%] px-6 py-4 text-base font-medium leading-7 rounded-2xl ${
              message.role === "user"
                ? "bg-[#663820] text-white rounded-br-sm"
                : "bg-[#f3e4c7] text-[#212a3b] rounded-bl-sm"
            }`}
          >
            {message.content}
          </div>
        </div>
      ))}

      {/* User Streaming Message */}
      {currentUserMessage && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex justify-end">
          <div className="max-w-[80%] px-6 py-4 text-base font-medium leading-7 rounded-2xl bg-[#663820] text-white rounded-br-sm">
            {currentUserMessage}
            <span className="inline-block w-0.5 h-5 ml-1 bg-black animate-pulse" />
          </div>
        </div>
      )}

      {/* Assistant Streaming Message */}
      {currentMessage && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex justify-start">
          <div className="max-w-[80%] px-6 py-4 text-base font-medium leading-7 rounded-2xl bg-[#f3e4c7] text-[#212a3b] rounded-bl-sm">
            {currentMessage}
            <span className="inline-block w-0.5 h-5 ml-1 bg-black animate-pulse" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Transcript;
