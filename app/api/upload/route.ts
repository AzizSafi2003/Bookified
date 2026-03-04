import { MAX_FILE_SIZE, MAX_IMAGE_SIZE } from "@/lib/constants";
import { auth } from "@clerk/nextjs/server";
import { handleUpload, HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,

      onBeforeGenerateToken: async (pathname) => {
        const { userId } = await auth();

        if (!userId) {
          throw new Error("Unauthorized: User not authenticated");
        }
        /* Determine max size based on content type (inferred from pathname extension) */
        const isImage = /\.(jpe?g|png|webp)$/i.test(pathname);
        const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;

        return {
          allowedContentTypes: [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp",
          ],
          addRandomSuffix: true,
          maximumSizeInBytes: maxSize,
          tokenPayload: JSON.stringify({ userId }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("File uploaded to blob: ", blob.url);

        const payload = tokenPayload ? JSON.parse(tokenPayload) : null;
        const userId = payload?.userId;
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred!";
    const status = message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
