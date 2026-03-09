"use client";

import React from "react";
import { voiceCategories, voiceOptions } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { VoiceSelectorProps } from "@/types";

const VoiceSelector = ({
  value,
  onChange,
  disabled,
  className,
}: VoiceSelectorProps) => {
  return (
    <div className={cn("space-y-6", className)}>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        className="space-y-8"
      >
        {/* Male Voices */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-[#777]">Male Voices</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 items-center justify-center p-4 border border-(--border-subtle) rounded-lg cursor-pointer transition-all">
            {voiceCategories.male.map((voiceId) => {
              const voice = voiceOptions[voiceId as keyof typeof voiceOptions];
              const isSelected = value === voiceId;
              return (
                <Label
                  key={voiceId}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-3 p-4 border border-[var(--border-subtle)] rounded-lg cursor-pointer transition-all [box-shadow:var(--shadow-soft-sm)] hover:[box-shadow:var(--shadow-soft)] hover:-translate-y-0.5 h-32 md:h-24",
                    isSelected
                      ? "bg-[var(--accent-light)] border-[var(--accent-warm)]"
                      : "bg-white hover:bg-[var(--bg-secondary)]",
                    disabled &&
                      "opacity-50 cursor-not-allowed hover:translate-y-0 hover:[box-shadow:var(--shadow-soft-sm)]",
                  )}
                >
                  <RadioGroupItem
                    value={voiceId}
                    id={voiceId}
                    className="sr-only"
                  />
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full border flex items-center justify-center",
                          isSelected ? "border-[#663820]" : "border-gray-300",
                        )}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-[#663820]" />
                        )}
                      </div>
                      <span className="font-bold text-[#212a3b]">
                        {voice.name}
                      </span>
                    </div>
                    <p className="text-xs text-[#777] leading-relaxed">
                      {voice.description}
                    </p>
                  </div>
                </Label>
              );
            })}
          </div>
        </div>

        {/* Female Voices */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-[#777]">Female Voices</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 items-center justify-center p-4 border border-(--border-subtle) rounded-lg cursor-pointer transition-all">
            {voiceCategories.female.map((voiceId) => {
              const voice = voiceOptions[voiceId as keyof typeof voiceOptions];
              const isSelected = value === voiceId;
              return (
                <Label
                  key={voiceId}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-3 p-4 border border-[var(--border-subtle)] rounded-lg cursor-pointer transition-all [box-shadow:var(--shadow-soft-sm)] hover:[box-shadow:var(--shadow-soft)] hover:-translate-y-0.5 h-32 md:h-24",
                    isSelected
                      ? "bg-[var(--accent-light)] border-[var(--accent-warm)]"
                      : "bg-white hover:bg-[var(--bg-secondary)]",
                    disabled &&
                      "opacity-50 cursor-not-allowed hover:translate-y-0 hover:[box-shadow:var(--shadow-soft-sm)]",
                  )}
                >
                  <RadioGroupItem
                    value={voiceId}
                    id={voiceId}
                    className="sr-only"
                  />
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full border flex items-center justify-center",
                          isSelected ? "border-[#663820]" : "border-gray-300",
                        )}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-[#663820]" />
                        )}
                      </div>
                      <span className="font-bold text-[#212a3b]">
                        {voice.name}
                      </span>
                    </div>
                    <p className="text-xs text-[#777] leading-relaxed">
                      {voice.description}
                    </p>
                  </div>
                </Label>
              );
            })}
          </div>
        </div>
      </RadioGroup>
    </div>
  );
};

export default VoiceSelector;
