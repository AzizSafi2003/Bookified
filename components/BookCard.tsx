import { BookCardProps } from "@/types";
import { Edit3, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const BookCard = ({
  _id,
  title,
  author,
  coverURL,
  slug,
  canDelete = false,
  isDeleting = false,
  onEdit,
  onDelete,
}: BookCardProps) => {
  return (
    <Link href={`/books/${slug}`}>
      <article className="flex flex-col transition-all duration-200 h-full border-0 hover:-translate-y-1">
        <figure className="book-card-figure">
          <div className="relative bg-white rounded-[14px] overflow-hidden flex items-center justify-center h-51.25 md:h-60 shadow-md">
            {canDelete ? (
              <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5">
                <button
                  type="button"
                  title="Edit Book"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (isDeleting) return;
                    onEdit?.(slug);
                  }}
                  disabled={isDeleting}
                  aria-label={`Edit ${title}`}
                  className={`p-1.5 rounded-md transition-colors duration-200 ${
                    isDeleting
                      ? "bg-green-500 cursor-not-allowed opacity-90"
                      : "bg-green-400 hover:bg-green-500 cursor-pointer"
                  }`}
                >
                  <Edit3 className="size-4 text-white" />
                </button>
                <button
                  type="button"
                  title="Delete Book"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (isDeleting) return;
                    onDelete?.(_id);
                  }}
                  disabled={isDeleting}
                  aria-label={`Delete ${title}`}
                  className={`p-1.5 rounded-md transition-colors duration-200 ${
                    isDeleting
                      ? "bg-red-500 cursor-not-allowed opacity-90"
                      : "bg-red-400 hover:bg-red-500 cursor-pointer"
                  }`}
                >
                  {isDeleting ? (
                    <Loader2 className="size-4 text-white animate-spin" />
                  ) : (
                    <Trash2 className="size-4 text-white" />
                  )}
                </button>
              </div>
            ) : null}
            <Image
              src={coverURL}
              alt={title}
              width={133}
              height={200}
              className="w-auto h-42.5 md:h-50 object-cover rounded-lg shadow-md"
            />
          </div>

          <figcaption className="mt-4 md:mt-5 flex-1 flex flex-col gap-1">
            <h3 className="font-bold text-[#212a3b] line-clamp-1 text-base md:text-xl leading-5.5 md:leading-7.5">
              {title}
            </h3>
            <p className="text-sm md:text-base font-medium text-[#3d485e] line-clamp-1">
              {author}
            </p>
          </figcaption>
        </figure>
      </article>
    </Link>
  );
};

export default BookCard;
