import HeroSection from "@/components/HeroSection";
import HomeBooksSearch from "@/components/HomeBooksSearch";
import HomeBooksPagination from "@/components/HomeBooksPagination";
import { getAllBooks } from "@/lib/actions/book.actions";
import { auth } from "@clerk/nextjs/server";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

export const dynamic = "force-dynamic";

const page = async ({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) => {
  const { userId } = await auth();
  const { q = "" } = await searchParams;
  const query = q.trim();
  const bookResults = await getAllBooks(query);
  const books = bookResults.success ? (bookResults.data ?? []) : [];

  return (
    <main className="max-w-7xl px-5 mx-auto w-full pt-[94px] pb-18 min-h-screen">
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
        <HomeBooksPagination
          key={query || "all-books"}
          books={books}
          currentUserId={userId}
        />
      </SignedIn>

      <SignedOut>
        <div className="flex flex-col items-center justify-center min-h-[350px] text-center flex-1">
          <User className="size-12 text-[#212a3b] mb-4" />
          <h2 className="text-[var(--text-primary)] text-lg font-bold">
            <b>Not Authorized!</b>
          </h2>
          <p className="text-[var(--text-muted)] text-base mt-1">
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
