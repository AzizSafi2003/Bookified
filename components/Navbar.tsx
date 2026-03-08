"use client";

import { cn } from "@/lib/utils";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  useAuth,
  UserButton,
} from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { DollarSign } from "lucide-react";
import { toast } from "sonner"; // or import toast from "react-hot-toast"

const navItems = [
  {
    label: "Library",
    href: "/",
    requiresAuth: false, // Public route
  },
  {
    label: "Add New",
    href: "/books/new",
    requiresAuth: true, // Protected route
  },
];

const Navbar = () => {
  const pathName = usePathname();
  const router = useRouter();
  const { userId, isLoaded } = useAuth();

  const handleNavClick = (
    e: React.MouseEvent,
    href: string,
    requiresAuth: boolean,
  ) => {
    // Allow if no auth required
    if (!requiresAuth) return;

    // Block if auth required but user not signed in
    if (!userId) {
      e.preventDefault();
      toast.error("You must sign in first to access this page");
    }
  };

  return (
    <header className="w-full fixed z-50 bg-(--bg-primary) px-4 xl:px-37 border-b">
      <div className="wrapper navbar-height py-4 flex justify-between items-center">
        <Link href="/" className="flex gap-0.5 items-center">
          <Image
            src="/assets/logo.png"
            alt="Bookified"
            width={42}
            height={26}
          />
          <span className="font-semibold text-xl hidden sm:block text-black">
            Bookified
          </span>
        </Link>

        <nav className="w-fit flex gap-5 md:gap-7.5 items-center">
          {navItems.map(({ label, href, requiresAuth }) => {
            const isActive =
              pathName === href || (href !== "/" && pathName.startsWith(href));

            return (
              <Link
                href={href}
                key={label}
                onClick={(e) => handleNavClick(e, href, requiresAuth || false)}
                className={cn(
                  "text-sm font-medium leading-6 transition-all cursor-pointer",
                  isActive
                    ? "text-(--color-brand) border-b-2 border-(--color-brand) pb-0.5"
                    : "text-black hover:opacity-70",
                )}
              >
                {label}
              </Link>
            );
          })}

          <div className="flex gap-7.5 items-center">
            <SignedOut>
              <SignInButton mode="modal">
                <Button asChild>
                  <span>Sign In</span>
                </Button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <UserButton>
                <UserButton.MenuItems>
                  <UserButton.Link
                    label="Subscriptions"
                    labelIcon={<DollarSign className="size-4" />}
                    href="/subscriptions"
                  />
                </UserButton.MenuItems>
              </UserButton>
            </SignedIn>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
