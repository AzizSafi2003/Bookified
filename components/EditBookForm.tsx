"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon, Upload } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { upload } from "@vercel/blob/client";

import { EditBookSchema } from "@/lib/zod";
import { BookEditFormValues } from "@/types";
import { parsePDFFile } from "@/lib/utils";
import { replaceBookSegments } from "@/lib/actions/book.actions";
import { ACCEPTED_IMAGE_TYPES, ACCEPTED_PDF_TYPES } from "@/lib/constants";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import FileUploader from "@/components/FileUploader";
import VoiceSelector from "@/components/VoiceSelector";
import LoadingOverlay from "@/components/LoadingOverlay";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type EditableBook = {
  _id: string;
  slug: string;
  title: string;
  author: string;
  persona?: string;
  coverURL: string;
};

const EditBookForm = ({ book }: { book: EditableBook }) => {
  const router = useRouter();
  const { userId } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const form = useForm<BookEditFormValues>({
    resolver: zodResolver(EditBookSchema),
    defaultValues: {
      title: book.title,
      author: book.author,
      persona: book.persona || "",
      pdfFile: undefined,
      coverImage: undefined,
    },
  });

  const onSubmit = async (data: BookEditFormValues) => {
    if (!userId) {
      toast.error("Please login to edit books");
      return;
    }

    setIsSubmitting(true);

    try {
      const fileTitle = data.title.replace(/\s+/g, "-").toLowerCase();
      let parsedPdfResult: Awaited<ReturnType<typeof parsePDFFile>> | null = null;

      const updatePayload: {
        title: string;
        author: string;
        persona: string;
        fileURL?: string;
        fileBlobKey?: string;
        fileSize?: number;
        coverURL?: string;
        coverBlobKey?: string;
      } = {
        title: data.title,
        author: data.author,
        persona: data.persona,
      };

      if (data.pdfFile) {
        parsedPdfResult = await parsePDFFile(data.pdfFile);

        if (parsedPdfResult.content.length === 0) {
          toast.error("Failed to parse PDF. Please try a different file.");
          return;
        }

        const uploadedPdfBlob = await upload(fileTitle, data.pdfFile, {
          access: "public",
          handleUploadUrl: "/api/upload",
          contentType: "application/pdf",
        });

        updatePayload.fileURL = uploadedPdfBlob.url;
        updatePayload.fileBlobKey = uploadedPdfBlob.pathname;
        updatePayload.fileSize = data.pdfFile.size;
      }

      if (data.coverImage) {
        const uploadedCoverBlob = await upload(`${fileTitle}_cover.png`, data.coverImage, {
          access: "public",
          handleUploadUrl: "/api/upload",
          contentType: data.coverImage.type,
        });

        updatePayload.coverURL = uploadedCoverBlob.url;
        updatePayload.coverBlobKey = uploadedCoverBlob.pathname;
      } else if (parsedPdfResult) {
        const response = await fetch(parsedPdfResult.cover);
        const blob = await response.blob();

        const uploadedCoverBlob = await upload(`${fileTitle}_cover.png`, blob, {
          access: "public",
          handleUploadUrl: "/api/upload",
          contentType: "image/png",
        });

        updatePayload.coverURL = uploadedCoverBlob.url;
        updatePayload.coverBlobKey = uploadedCoverBlob.pathname;
      }

      const response = await fetch(`/api/books/${book._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      const payload = (await response.json()) as {
        error?: string;
        data?: { slug?: string };
      };

      if (!response.ok) {
        throw new Error(payload.error || "Failed to update book");
      }

      if (parsedPdfResult) {
        const replaceSegmentsResult = await replaceBookSegments(
          book._id,
          userId,
          parsedPdfResult.content,
        );

        if (!replaceSegmentsResult.success) {
          throw new Error("Book details updated but failed to refresh segments");
        }
      }

      toast.success("Book updated successfully");
      const updatedSlug = payload.data?.slug || book.slug;
      router.push(`/books/${updatedSlug}`);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update book";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMounted) return null;

  return (
    <>
      {isSubmitting ? <LoadingOverlay /> : null}

      <div className="mx-auto max-w-2xl space-y-6 mt-12 mb-20">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FileUploader
              control={form.control}
              name="pdfFile"
              label="Book PDF File (Optional)"
              acceptTypes={ACCEPTED_PDF_TYPES}
              icon={Upload}
              placeholder="Click to upload a new PDF"
              hint="Leave empty to keep current PDF"
              disabled={isSubmitting}
            />

            <FileUploader
              control={form.control}
              name="coverImage"
              label="Cover Image (Optional)"
              acceptTypes={ACCEPTED_IMAGE_TYPES}
              icon={ImageIcon}
              placeholder="Click to upload a new cover image"
              hint="Leave empty to keep current cover"
              disabled={isSubmitting}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-medium text-black mb-2 block">
                    Title
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="w-full p-4 bg-white rounded-lg text-lg font-medium text-[#222] placeholder:text-[#999]"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="author"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-medium text-black mb-2 block">
                    Author Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="w-full p-4 bg-white rounded-lg text-lg font-medium text-[#222] placeholder:text-[#999]"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="persona"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-medium text-black mb-2 block">
                    Choose Assistant Voice
                  </FormLabel>
                  <FormControl>
                    <VoiceSelector
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="!w-full h-14 rounded-[10px] bg-[#663820] cursor-pointer hover:bg-[#7a4528] text-xl text-white font-bold transition-colors font-serif"
              disabled={isSubmitting}
            >
              Save Changes
            </Button>
          </form>
        </Form>
      </div>
    </>
  );
};

export default EditBookForm;
