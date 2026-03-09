import EditBookForm from "@/components/EditBookForm";
import { getBookBySlug } from "@/lib/actions/book.actions";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function EditBookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { userId } = await auth();
  const { slug } = await params;

  if (!userId) {
    redirect(`/sign-in?returnBackUrl=/book/edit/${slug}`);
  }

  const result = await getBookBySlug(slug);

  if (!result.success || !result.data) {
    redirect("/");
  }

  const book = result.data;

  if (book.clerkId !== userId) {
    redirect("/");
  }

  return (
    <main className="max-w-7xl px-5 mx-auto w-full pt-23.5 pb-18 min-h-screen">
      <div className="mx-auto max-w-180 space-y-10">
        <section className="flex flex-col gap-5">
          <h1 className="text-4xl md:text-5xl font-semibold text-black tracking-[-0.02em] leading-13.5 font-serif">
            Edit Book
          </h1>
          <p className="text-xl text-(--text-secondary) leading-7">
            Update your book details, voice, and files.
          </p>
        </section>

        <EditBookForm book={book} />
      </div>
    </main>
  );
}
