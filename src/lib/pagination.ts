/**
 * @fileoverview Pure pagination utilities — testable without React.
 */

/**
 * Generate page numbers with ellipsis.
 *
 * Rules:
 *  - Always show page 1 and the last page.
 *  - Show the current page ±1 window around it.
 *  - Insert "…" between non-adjacent numbers (at most one consecutive ellipsis).
 *  - For small page counts (≤ 7) show every page with no ellipsis.
 */
export function buildPageNumbers(
  currentPage: number,
  totalPages: number,
): (number | "...")[] {
  if (totalPages <= 0) return [];

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

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
  return pages;
}

/**
 * Build a URL that preserves existing search params and sets the page.
 */
export function buildPageUrl(
  page: number,
  baseUrl: string,
  searchParams: Record<string, string>,
): string {
  const params = new URLSearchParams(searchParams);
  params.set("page", page.toString());
  return `${baseUrl}?${params.toString()}`;
}
