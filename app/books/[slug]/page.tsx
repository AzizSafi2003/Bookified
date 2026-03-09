import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getBookBySlug } from "@/lib/actions/book.actions";

import VapiControls from "@/components/VapiControls";

export default async function BookDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { slug } = await params;
  const result = await getBookBySlug(slug);

  if (!result.success || !result.data) {
    redirect("/");
  }

  const book = result.data;

  return (
    <div className="max-w-7xl px-5 mx-auto w-full pt-20 sm:pt-28 min-h-screen pb-12">
      <Link
        href="/"
        className="fixed top-24 left-6 z-50 size-12 rounded-full bg-white border border-[var(--border-subtle)] flex items-center justify-center transition-all [box-shadow:var(--shadow-soft)] hover:[box-shadow:var(--shadow-soft-md)] hover:-translate-y-0.5"
      >
        <ArrowLeft className="size-6 text-[#212a3b]" />
      </Link>

      <VapiControls book={book} />
    </div>
  );
}
