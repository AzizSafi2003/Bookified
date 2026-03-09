import { auth } from "@clerk/nextjs/server";
import { PricingTable } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default async function SubscriptionsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?returnBackUrl=/subscriptions");
  }

  return (
    <div className="max-w-7xl px-5 mx-auto w-full pt-[94px] min-h-screen py-10">
      <div className="flex flex-col items-center text-center mb-10">
        <h1 className="text-4xl font-bold font-serif mb-4">Choose Your Plan</h1>
        <p className="text-muted-foreground max-w-2xl">
          Upgrade to unlock more books, longer sessions, and advanced features.
        </p>
      </div>

      <div className="clerk-pricing-container">
        <PricingTable />
      </div>
    </div>
  );
}
