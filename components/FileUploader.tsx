"use client";

import React, { useCallback, useRef } from "react";
import { useController, FieldValues } from "react-hook-form";
import { X } from "lucide-react";
import { FileUploadFieldProps } from "@/types";
import { cn } from "@/lib/utils";
import {
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

const FileUploader = <T extends FieldValues>({
  control,
  name,
  label,
  acceptTypes,
  disabled,
  icon: Icon,
  placeholder,
  hint,
}: FileUploadFieldProps<T>) => {
  const {
    field: { onChange, value },
  } = useController({ name, control });

  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onChange(file);
      }
    },
    [onChange],
  );

  const onRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(undefined);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [onChange],
  );

  const isUploaded = !!value;

  return (
    <FormItem className="w-full">
      <FormLabel className="text-lg font-medium text-black mb-2 block">
        {label}
      </FormLabel>
      <FormControl>
        <div
          className={cn(
            "flex flex-col items-center justify-center h-[165px] rounded-[6px] cursor-pointer transition-all border-2 border-dashed border-[#8B7355]/20",
            isUploaded ? "bg-[#f3e4c7]" : "bg-white hover:bg-gray-50",
          )}
          onClick={() => !disabled && inputRef.current?.click()}
        >
          <input
            type="file"
            accept={acceptTypes.join(",")}
            className="hidden"
            ref={inputRef}
            onChange={handleFileChange}
            disabled={disabled}
          />

          {isUploaded ? (
            <div className="flex flex-col items-center relative w-full px-4">
              <p className="text-[#663820] text-lg font-medium text-center line-clamp-1">
                {(value as File).name}
              </p>
              <button
                type="button"
                onClick={onRemove}
                className="flex items-center justify-center w-6 h-6 text-red-500 transition-colors cursor-pointer hover:text-red-600 mt-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              <Icon className="w-12 h-12 mb-2 text-[#8B7355]" />
              <p className="text-[#777] text-lg font-medium text-center">
                {placeholder}
              </p>
              <p className="text-[#777] text-sm mt-1">{hint}</p>
            </>
          )}
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
};

export default FileUploader;
