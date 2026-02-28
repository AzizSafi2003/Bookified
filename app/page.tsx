import HeroSection from "@/components/HeroSection";
import { sampleBooks } from "@/lib/constants";
import BookCard from "@/components/BookCard";

const page = () => {
  return (
    <main className="max-w-7xl px-5 mx-auto w-full container">
      <HeroSection />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 md:gap-x-10 gap-y-7 md:gap-y-9">
        {sampleBooks.map((book) => (
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
