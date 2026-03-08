"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const HomeBooksSearch = ({ initialQuery }: { initialQuery: string }) => {
  const [query, setQuery] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleChange = (value: string) => {
    setQuery(value);

    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      const normalized = value.trim();

      if (normalized) {
        params.set("q", normalized);
      } else {
        params.delete("q");
      }

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname);
    });
  };

  return (
    <div className="library-search-wrapper">
      <Input
        type="text"
        name="q"
        value={query}
        placeholder="Search by title or author"
        className="library-search-input border-0 rounded-none shadow-none focus-visible:ring-0"
        onChange={(event) => handleChange(event.target.value)}
      />
      <Button type="button" variant="ghost" size="icon" aria-label="Search books">
        <Search className="size-4 text-(--text-primary)" />
      </Button>
      {isPending ? (
        <span className="sr-only" aria-live="polite">
          Searching books
        </span>
      ) : null}
    </div>
  );
};

export default HomeBooksSearch;
