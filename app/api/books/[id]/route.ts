import { connectToDatabase } from "@/database/mongoose";
import Book from "@/database/models/book.model";
import { generateSlug, serializeData } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ id: string }>;
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
      coverURL?: string;
      coverBlobKey?: string;
    };

    const updateData: {
      title?: string;
      slug?: string;
      author?: string;
      persona?: string;
      coverURL?: string;
      coverBlobKey?: string;
    } = {};

    if (body.title) {
      updateData.title = body.title;
      updateData.slug = generateSlug(body.title);
    }
    if (body.author) updateData.author = body.author;
    if (typeof body.persona === "string") updateData.persona = body.persona;
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

    const updatedBook = await Book.findOneAndUpdate(
      { _id: id, clerkId: userId },
      { $set: updateData },
      { new: true },
    ).lean();

    if (!updatedBook) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

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

    const deletedBook = await Book.findOneAndDelete({ _id: id, clerkId: userId });

    if (!deletedBook) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting book:", error);
    return NextResponse.json(
      { error: "Failed to delete book" },
      { status: 500 },
    );
  }
}
