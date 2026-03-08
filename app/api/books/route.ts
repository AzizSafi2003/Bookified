import { connectToDatabase } from "@/database/mongoose";
import Book from "@/database/models/book.model";
import { generateSlug, serializeData } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      title?: string;
      author?: string;
      persona?: string;
      fileURL?: string;
      fileBlobKey?: string;
      coverURL?: string;
      coverBlobKey?: string;
      fileSize?: number;
    };

    if (
      !body.title ||
      !body.author ||
      !body.fileURL ||
      !body.fileBlobKey ||
      !body.coverURL ||
      typeof body.fileSize !== "number"
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const slug = generateSlug(body.title);
    const existing = await Book.findOne({ slug }).lean();

    if (existing) {
      return NextResponse.json(
        { error: "A book with this title already exists" },
        { status: 409 },
      );
    }

    const createdBook = await Book.create({
      clerkId: userId,
      title: body.title,
      slug,
      author: body.author,
      persona: body.persona,
      fileURL: body.fileURL,
      fileBlobKey: body.fileBlobKey,
      coverURL: body.coverURL,
      coverBlobKey: body.coverBlobKey,
      fileSize: body.fileSize,
      totalSegments: 0,
    });

    return NextResponse.json(
      { success: true, data: serializeData(createdBook) },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating book:", error);
    return NextResponse.json(
      { error: "Failed to create book" },
      { status: 500 },
    );
  }
}
