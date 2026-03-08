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
    redirect(`/sign-in?returnBackUrl=/books/${slug}/edit`);
  }

  return null;
}
