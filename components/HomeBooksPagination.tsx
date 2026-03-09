"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import BookCard from "@/components/BookCard";
import { Button } from "@/components/ui/button";

interface HomeBook {
  _id: string;
  clerkId: string;
  title: string;
  author: string;
  coverURL: string;
  slug: string;
}

const BOOKS_PER_PAGE = 10;

const HomeBooksPagination = ({
  books,
  currentUserId,
}: {
  books: HomeBook[];
  currentUserId: string | null;
}) => {
  const router = useRouter();
  const [deletedBookIds, setDeletedBookIds] = useState<Set<string>>(new Set());
  const [deletingBookIds, setDeletingBookIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const visibleBooks = useMemo(
    () => books.filter((book) => !deletedBookIds.has(book._id)),
    [books, deletedBookIds],
  );

  const totalPages = Math.max(1, Math.ceil(visibleBooks.length / BOOKS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedBooks = useMemo(() => {
    const start = (safeCurrentPage - 1) * BOOKS_PER_PAGE;
    const end = start + BOOKS_PER_PAGE;
    return visibleBooks.slice(start, end);
  }, [visibleBooks, safeCurrentPage]);

  const isFirstPage = safeCurrentPage === 1;
  const isLastPage = safeCurrentPage === totalPages;

  const handleBack = () => {
    if (isFirstPage) return;
    setCurrentPage(Math.max(1, safeCurrentPage - 1));
  };

  const handleNext = () => {
    if (isLastPage) return;
    setCurrentPage(Math.min(totalPages, safeCurrentPage + 1));
  };

  const deleteBook = async (bookId: string) => {
    const response = await fetch(`/api/books/${bookId}`, { method: "DELETE" });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      throw new Error(payload.error || "Failed to delete book");
    }
  };

  const handleDeletePrompt = (book: HomeBook) => {
    if (deletingBookIds.has(book._id)) return;

    const toastId = toast.custom(() => (
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-4 shadow-md">
        <p className="text-sm font-medium text-[#212a3b]">
          Are you sure you want to delete this book?
        </p>
        <p className="mt-1 text-xs text-[#3d485e] line-clamp-1">{book.title}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            onClick={() => toast.dismiss(toastId)}
            className="rounded-md border border-[#212a3b] bg-transparent text-[#212a3b] hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={async () => {
              toast.dismiss(toastId);
              setDeletingBookIds((prev) => {
                const next = new Set(prev);
                next.add(book._id);
                return next;
              });

              try {
                await deleteBook(book._id);
                setDeletedBookIds((prev) => {
                  const next = new Set(prev);
                  next.add(book._id);
                  return next;
                });
                toast.success("Book deleted successfully");
                router.refresh();
              } catch (error) {
                const message =
                  error instanceof Error ? error.message : "Failed to delete book";
                toast.error(message);
              } finally {
                setDeletingBookIds((prev) => {
                  const next = new Set(prev);
                  next.delete(book._id);
                  return next;
                });
              }
            }}
            className="rounded-md bg-red-500 text-white hover:bg-red-600"
          >
            Delete
          </Button>
        </div>
      </div>
    ));
  };

  return (
    <section className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 md:gap-x-10 gap-y-7 md:gap-y-9">
        {paginatedBooks.map((book) => (
          <BookCard
            key={book._id}
            _id={book._id}
            title={book.title}
            author={book.author}
            coverURL={book.coverURL}
            slug={book.slug}
            canDelete={book.clerkId === currentUserId}
            isDeleting={deletingBookIds.has(book._id)}
            onEdit={(slug) => router.push(`/book/edit/${slug}`)}
            onDelete={() => handleDeletePrompt(book)}
          />
        ))}
      </div>

      {visibleBooks.length > 0 ? (
        <div className="flex items-center justify-center gap-3 sm:gap-5">
          <button
            type="button"
            onClick={handleBack}
            className={`flex items-center gap-1 px-3 py-2 sm:px-4 rounded-md border text-sm sm:text-base text-(--text-primary) border-(--border-medium) transition-colors ${
              isFirstPage
                ? "opacity-50 cursor-default"
                : "hover:bg-(--bg-secondary) cursor-pointer"
            }`}
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Back</span>
          </button>

          <span className="min-w-8 text-center font-semibold text-(--text-primary)">
            {safeCurrentPage}
          </span>

          <button
            type="button"
            onClick={handleNext}
            className={`flex items-center gap-1 px-3 py-2 sm:px-4 rounded-md border text-sm sm:text-base text-(--text-primary) border-(--border-medium) transition-colors ${
              isLastPage
                ? "opacity-50 cursor-default"
                : "hover:bg-(--bg-secondary) cursor-pointer"
            }`}
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      ) : null}
    </section>
  );
};

export default HomeBooksPagination;
