"use client";

import { Loader2 } from "lucide-react";

const LoadingOverlay = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm min-h-screen">
      <div className="rounded-xl p-10 w-fit md:min-w-md bg-white [box-shadow:var(--shadow-soft-lg)]">
        <div className="rounded-xl flex flex-col items-center space-y-6">
          <Loader2 className="animate-spin origin-center mx-auto w-12 h-12 text-[#663820]" />
          <h2 className="text-2xl font-bold text-(--text-primary)">
            Synthesizing Your Book
          </h2>
          <p className="text-[#777] text-center max-w-xs">
            Please wait while we process your PDF and prepare your interactive
            literary experience.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
