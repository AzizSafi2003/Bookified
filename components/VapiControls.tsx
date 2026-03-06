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
    start,
    stop,
    clearErrors,
  } = useVapi(book);

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
                onClick={isActive ? stop : start}
                disabled={status === "connecting" || status === "starting"}
                aria-label={
                  isActive ? "Stop voice assistant" : "Start voice assistant"
                }
                aria-pressed={isActive}
                title={
                  isActive ? "Stop Voice Assistant" : "Start Voice Assistant"
                }
                className="group relative w-15! h-15! sm:w-15 sm:h-15 cursor-pointer rounded-full flex items-center justify-center transition-all duration-300 border-0 bg-white shadow-md active:scale-90"
              >
                {isActive ? (
                  <Mic className="size-7 text-[#212a3b] transition-colors duration-300 group-hover:text-gray-400" />
                ) : (
                  <MicOff className="size-7 text-[#212a3b] transition-colors duration-300 group-hover:text-gray-400" />
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
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg">
                <span className="inline-block w-3 h-3 rounded-full bg-gray-400" />
                <span className="text-sm font-medium text-[#212a3b]">
                  Ready
                </span>
              </div>

              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg">
                <span className="text-sm font-medium text-[#212a3b]">
                  Voice: {book.persona || "Daniel"}
                </span>
              </div>

              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg">
                <span className="text-sm font-medium text-[#212a3b]">
                  0:00/15:00
                </span>
              </div>
            </div>
          </div>
        </div>

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
