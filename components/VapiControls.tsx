"use client";
import useVapi from "@/hooks/useVapi";
import { IBook } from "@/types";
import { Mic, MicOff } from "lucide-react";
import Image from "next/image";

import placeholderImage from "@/public/assets/book-replace.png";
import Transcript from "./Transcript";

const VapiControls = ({ book }: { book: IBook }) => {
  const {
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
  } = useVapi(book);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const statusLabelByState = {
    idle: "Ready",
    connecting: "Connecting",
    starting: "Starting",
    listening: "Listening",
    thinking: "Thinking",
    speaking: "Speaking",
  } as const;

  const statusDotClassByState = {
    idle: "vapi-status-dot-ready",
    connecting: "vapi-status-dot-connecting",
    starting: "vapi-status-dot-connecting",
    listening: "vapi-status-dot-listening",
    thinking: "vapi-status-dot-thinking",
    speaking: "vapi-status-dot-speaking",
  } as const;

  return (
    <>
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        {/* Header Card */}
        <div className="flex items-center gap-6 bg-[#f3e4c7] rounded-[14px] p-6 relative overflow-hidden">
          <div className="relative shrink-0">
            <Image
              src={book.coverURL || placeholderImage}
              alt={book.title}
              width={120}
              height={180}
              className="relative w-30! h-auto! sm:w-40.5 sm:h-60 rounded-lg object-cover shadow-xl"
              priority
            />
            <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2">
              <button
                onClick={() => {
                  if (isActive) {
                    void stop();
                    return;
                  }
                  clearErrors();
                  void start();
                }}
                disabled={status === "connecting" || status === "starting"}
                aria-label={
                  isActive ? "Stop voice assistant" : "Start voice assistant"
                }
                aria-pressed={isActive}
                title={
                  isActive ? "Stop Voice Assistant" : "Start Voice Assistant"
                }
                className={`group relative w-15! h-15! sm:w-15 sm:h-15 cursor-pointer rounded-full flex items-center justify-center transition-all duration-300 border-0 shadow-md active:scale-90 ${isActive ? "bg-[#212a3b] animate-pulse" : "bg-white"}`}
              >
                {isActive ? (
                  <Mic
                    className={`size-7 transition-colors duration-300 group-hover:text-gray-400 ${isActive ? "text-white" : "text-[#212a3b]"}`}
                  />
                ) : (
                  <MicOff
                    className={`size-7 transition-colors duration-300 group-hover:text-gray-400 ${isActive ? "text-white" : "text-[#212a3b]"}`}
                  />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 flex-1">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#212a3b] mb-1">
                {book.title}
              </h1>
              <p className="text-[#3d485e] font-medium">by {book.author}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="vapi-status-indicator">
                <span
                  className={`vapi-status-dot ${statusDotClassByState[status]}`}
                />
                <span className="vapi-status-text">
                  {statusLabelByState[status]}
                </span>
              </div>

              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg">
                <span className="text-sm font-medium text-[#212a3b]">
                  Voice: {book.persona || "Daniel"}
                </span>
              </div>

              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg">
                <span className="text-sm font-medium text-[#212a3b]">
                  {formatDuration(duration)}/
                  {formatDuration(maxDurationMinutes * 60)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {limitError && (
          <p className="text-sm text-red-600 font-medium">{limitError}</p>
        )}

        {/* Header Body */}
        <div className="min-h-100 max-h-[60vh] flex flex-col">
          <div className="w-full bg-white rounded-[14px] h-full flex flex-col min-h-100">
            <Transcript
              messages={messages}
              currentMessage={currentMessage}
              currentUserMessage={currentUserMessage}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default VapiControls;
