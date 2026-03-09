import UploadForm from "@/components/UploadForm";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import React from "react";

const page = async () => {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?returnBackUrl=/books/new");
  }

  return (
    <main className="max-w-7xl px-5 mx-auto w-full pt-23.5 pb-18 min-h-screen">
      <div className="mx-auto max-w-180 space-y-10">
        <section className="flex flex-col gap-5">
          <h1 className="text-4xl md:text-5xl font-semibold text-black tracking-[-0.02em] leading-13.5 font-serif">
            Add a New Book
          </h1>
          <p className="text-xl text-(--text-secondary) leading-7">
            Upload a PDF to generate your interactive reading experience.
          </p>
        </section>

        <UploadForm />
      </div>
    </main>
  );
};

export default page;
