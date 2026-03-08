import HeroSection from "@/components/HeroSection";
import BookCard from "@/components/BookCard";
import HomeBooksSearch from "@/components/HomeBooksSearch";
import { getAllBooks } from "@/lib/actions/book.actions";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

export const dynamic = "force-dynamic";

const page = async ({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) => {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const bookResults = await getAllBooks(query);
  const books = bookResults.success ? (bookResults.data ?? []) : [];

  return (
    <main className="max-w-7xl px-5 mx-auto w-full container">
      <HeroSection />

      <SignedIn>
        <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
          <h2 className="font-semibold text-2xl text-[#212a3b]">
            Recent Books
          </h2>
          <div className="w-full sm:w-auto">
            <HomeBooksSearch initialQuery={query} />
          </div>
        </section>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 md:gap-x-10 gap-y-7 md:gap-y-9">
          {books.map((book) => (
            <BookCard
              key={book._id}
              title={book.title}
              author={book.author}
              coverURL={book.coverURL}
              slug={book.slug}
            />
          ))}
        </div>
      </SignedIn>

      <SignedOut>
        <div className="transcript-empty">
          <User className="size-12 text-[#212a3b] mb-4" />
          <h2 className="transcript-empty-text">
            <b>Not Authorized!</b>
          </h2>
          <p className="text-(--text-muted) text-base mt-1">
            Please sign in to access your personalized library and start
            listening to your books.
          </p>
          <div className="mt-6">
            <SignInButton mode="modal">
              <Button asChild>
                <span>Get Started</span>
              </Button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>
    </main>
  );
};

export default page;
