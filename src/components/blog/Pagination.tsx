"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl?: string;
  searchParams?: Record<string, string>;
}

/**
 * Pagination — Smart pagination with ellipsis and URL-sync.
 */
export function Pagination({
  currentPage,
  totalPages,
  baseUrl = "/",
  searchParams = {},
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const buildUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    return `${baseUrl}?${params.toString()}`;
  };

  // Generate page numbers with ellipsis
  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
      {/* Prev */}
      {currentPage > 1 ? (
        <Link
          href={buildUrl(currentPage - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <span className="flex h-9 w-9 items-center justify-center text-muted-foreground/30">
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}

      {/* Pages */}
      {pages.map((page, i) =>
        page === "..." ? (
          <span key={`ellipsis-${i}`} className="flex h-9 w-9 items-center justify-center text-sm text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={page}
            href={buildUrl(page)}
            className={`flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors ${
              page === currentPage
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {page}
          </Link>
        ),
      )}

      {/* Next */}
      {currentPage < totalPages ? (
        <Link
          href={buildUrl(currentPage + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="flex h-9 w-9 items-center justify-center text-muted-foreground/30">
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
