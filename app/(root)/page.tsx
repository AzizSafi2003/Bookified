import HeroSection from "@/components/HeroSection";
import BookCard from "@/components/BookCard";
import { getAllBooks } from "@/lib/actions/book.actions";

const page = async () => {
  const bookResults = await getAllBooks();
  const books = bookResults.success ? (bookResults.data ?? []) : [];

  return (
    <main className="max-w-7xl px-5 mx-auto w-full container">
      <HeroSection />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 md:gap-x-10 gap-y-7 md:gap-y-9">
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
    </main>
  );
};

export default page;
