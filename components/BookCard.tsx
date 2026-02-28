import { BookCardProps } from "@/types";
import Image from "next/image";
import Link from "next/link";

const BookCard = ({ title, author, coverURL, slug }: BookCardProps) => {
  return (
    <Link href={`/books/${slug}`}>
      <article className="flex flex-col transition-all duration-200 h-full border-0 hover:-translate-y-1">
        <figure className="book-card-figure">
          <div className="relative bg-white rounded-[14px] overflow-hidden flex items-center justify-center h-51.25 md:h-60 shadow-md">
            <Image
              src={coverURL}
              alt={title}
              width={133}
              height={200}
              className="w-auto h-42.5 md:h-50 object-cover rounded-lg shadow-md"
            />
          </div>
        </figure>

        <figcaption className="mt-4 md:mt-5 flex-1 flex flex-col gap-1">
          <h3 className="font-bold text-[#212a3b] line-clamp-1 text-base md:text-xl leading-5.5 md:leading-7.5">
            {title}
          </h3>
          <p className="text-sm md:text-base font-medium text-[#3d485e] line-clamp-1">
            {author}
          </p>
        </figcaption>
      </article>
    </Link>
  );
};

export default BookCard;
