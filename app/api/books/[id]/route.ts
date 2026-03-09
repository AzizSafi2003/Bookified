import { connectToDatabase } from "@/database/mongoose";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";
import { generateSlug, serializeData } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const parseBlobKeyFromUrl = (url?: string | null) => {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    return parsed.pathname.replace(/^\/+/, "");
  } catch {
    return null;
  }
};

export async function PUT(request: Request, { params }: RouteParams) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid book id" }, { status: 400 });
    }

    const body = (await request.json()) as {
      title?: string;
      author?: string;
      persona?: string;
      fileURL?: string;
      fileBlobKey?: string;
      fileSize?: number;
      coverURL?: string;
      coverBlobKey?: string;
    };

    const updateData: {
      title?: string;
      slug?: string;
      author?: string;
      persona?: string;
      fileURL?: string;
      fileBlobKey?: string;
      fileSize?: number;
      coverURL?: string;
      coverBlobKey?: string;
    } = {};

    if (body.title) {
      updateData.title = body.title;
      updateData.slug = generateSlug(body.title);
    }
    if (body.author) updateData.author = body.author;
    if (typeof body.persona === "string") updateData.persona = body.persona;
    if (typeof body.fileURL === "string") updateData.fileURL = body.fileURL;
    if (typeof body.fileBlobKey === "string") updateData.fileBlobKey = body.fileBlobKey;
    if (typeof body.fileSize === "number") updateData.fileSize = body.fileSize;
    if (body.coverURL) updateData.coverURL = body.coverURL;
    if (typeof body.coverBlobKey === "string") {
      updateData.coverBlobKey = body.coverBlobKey;
    }

    await connectToDatabase();

    if (updateData.slug) {
      const duplicate = await Book.findOne({
        slug: updateData.slug,
        _id: { $ne: id },
      }).lean();

      if (duplicate) {
        return NextResponse.json(
          { error: "A book with this title already exists" },
          { status: 409 },
        );
      }
    }

    const existingBook = await Book.findOne({ _id: id, clerkId: userId }).lean();

    if (!existingBook) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const updatedBook = await Book.findOneAndUpdate(
      { _id: id, clerkId: userId },
      { $set: updateData },
      { new: true },
    ).lean();

    if (!updatedBook) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const replacedBlobKeys = new Set<string>();

    if (
      updateData.fileBlobKey &&
      existingBook.fileBlobKey &&
      updateData.fileBlobKey !== existingBook.fileBlobKey
    ) {
      replacedBlobKeys.add(existingBook.fileBlobKey);
    }

    if (
      updateData.coverBlobKey &&
      existingBook.coverBlobKey &&
      updateData.coverBlobKey !== existingBook.coverBlobKey
    ) {
      replacedBlobKeys.add(existingBook.coverBlobKey);
    }

    if (
      updateData.fileURL &&
      existingBook.fileURL &&
      updateData.fileURL !== existingBook.fileURL
    ) {
      const previousFileKey = parseBlobKeyFromUrl(existingBook.fileURL);
      if (previousFileKey) replacedBlobKeys.add(previousFileKey);
    }

    if (
      updateData.coverURL &&
      existingBook.coverURL &&
      updateData.coverURL !== existingBook.coverURL
    ) {
      const previousCoverKey = parseBlobKeyFromUrl(existingBook.coverURL);
      if (previousCoverKey) replacedBlobKeys.add(previousCoverKey);
    }

    if (replacedBlobKeys.size > 0) {
      try {
        await del(Array.from(replacedBlobKeys));
      } catch (blobError) {
        console.error("Blob cleanup failed after book update:", blobError);
      }
    }

    revalidatePath("/");

    return NextResponse.json({ success: true, data: serializeData(updatedBook) });
  } catch (error) {
    console.error("Error updating book:", error);
    return NextResponse.json(
      { error: "Failed to update book" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid book id" }, { status: 400 });
    }

    await connectToDatabase();

    const bookToDelete = await Book.findOne({ _id: id, clerkId: userId }).lean();

    if (!bookToDelete) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    await BookSegment.deleteMany({ bookId: bookToDelete._id });
    await Book.deleteOne({ _id: bookToDelete._id, clerkId: userId });

    const blobKeys = new Set<string>();

    if (bookToDelete.fileBlobKey) blobKeys.add(bookToDelete.fileBlobKey);
    if (bookToDelete.coverBlobKey) blobKeys.add(bookToDelete.coverBlobKey);

    const fileUrlBlobKey = parseBlobKeyFromUrl(bookToDelete.fileURL);
    const coverUrlBlobKey = parseBlobKeyFromUrl(bookToDelete.coverURL);

    if (fileUrlBlobKey) blobKeys.add(fileUrlBlobKey);
    if (coverUrlBlobKey) blobKeys.add(coverUrlBlobKey);

    if (blobKeys.size > 0) {
      try {
        await del(Array.from(blobKeys));
      } catch (blobError) {
        console.error("Blob cleanup failed after book deletion:", blobError);
      }
    }

    revalidatePath("/");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting book:", error);
    return NextResponse.json(
      { error: "Failed to delete book" },
      { status: 500 },
    );
  }
}
