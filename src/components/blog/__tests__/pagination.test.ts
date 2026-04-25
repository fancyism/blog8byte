import { describe, expect, it } from "vitest";
import {
  buildPageNumbers,
  buildPageUrl,
} from "../../../lib/pagination";

// ============================================================
// buildPageNumbers
// ============================================================

describe("buildPageNumbers", () => {
  // --- Edge cases ---

  it("returns empty array for 0 totalPages", () => {
    expect(buildPageNumbers(1, 0)).toEqual([]);
  });

  it("returns empty array for negative totalPages", () => {
    expect(buildPageNumbers(1, -1)).toEqual([]);
  });

  // --- Small page counts (<= 7) — show all pages, no ellipsis ---

  it("returns [1] for 1 total page", () => {
    expect(buildPageNumbers(1, 1)).toEqual([1]);
  });

  it("returns [1, 2] for 2 total pages on page 1", () => {
    expect(buildPageNumbers(1, 2)).toEqual([1, 2]);
  });

  it("returns [1, 2] for 2 total pages on page 2", () => {
    expect(buildPageNumbers(2, 2)).toEqual([1, 2]);
  });

  it("returns all pages for 3 total pages", () => {
    expect(buildPageNumbers(2, 3)).toEqual([1, 2, 3]);
  });

  it("returns all pages for 7 total pages on page 4", () => {
    expect(buildPageNumbers(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  // --- Large page counts (> 7) — ellipsis kicks in ---

  it("shows [1, 2, '...', 10] on page 1 of 10", () => {
    expect(buildPageNumbers(1, 10)).toEqual([1, 2, "...", 10]);
  });

  it("shows [1, 2, 3, '...', 10] on page 2 of 10", () => {
    expect(buildPageNumbers(2, 10)).toEqual([1, 2, 3, "...", 10]);
  });

  it("shows [1, '...', 4, 5, 6, '...', 10] on page 5 of 10", () => {
    expect(buildPageNumbers(5, 10)).toEqual([1, "...", 4, 5, 6, "...", 10]);
  });

  it("shows [1, '...', 9, 10] on page 10 of 10", () => {
    expect(buildPageNumbers(10, 10)).toEqual([1, "...", 9, 10]);
  });

  it("shows [1, '...', 7, 8, 9, 10] on page 8 of 10", () => {
    // page 8: window [7,8,9], last=10 adjacent to 9 → no ellipsis before 10
    expect(buildPageNumbers(8, 10)).toEqual([1, "...", 7, 8, 9, 10]);
  });

  // --- Regression: page 1 must ALWAYS be visible ---

  it("always includes page 1 regardless of current page", () => {
    for (let page = 1; page <= 20; page++) {
      const pages = buildPageNumbers(page, 20);
      expect(pages[0]).toBe(1);
    }
  });

  // --- Regression: last page must ALWAYS be visible ---

  it("always includes the last page regardless of current page", () => {
    for (let page = 1; page <= 20; page++) {
      const pages = buildPageNumbers(page, 20);
      const last = pages[pages.length - 1];
      expect(last).toBe(20);
    }
  });

  // --- Regression: current page must ALWAYS be visible ---

  it("always includes the current page", () => {
    for (let page = 1; page <= 20; page++) {
      const pages = buildPageNumbers(page, 20);
      expect(pages).toContain(page);
    }
  });

  // --- No consecutive ellipsis ---

  it("never has consecutive ellipsis entries", () => {
    for (let page = 1; page <= 50; page++) {
      const pages = buildPageNumbers(page, 50);
      for (let i = 1; i < pages.length; i++) {
        if (pages[i] === "..." && pages[i - 1] === "...") {
          expect.fail(`Consecutive ellipsis at page ${page} of 50: ${JSON.stringify(pages)}`);
        }
      }
    }
  });

  // --- Pages are in ascending order ---

  it("always produces numbers in ascending order", () => {
    for (let page = 1; page <= 30; page++) {
      const pages = buildPageNumbers(page, 30);
      const numbers = pages.filter((p): p is number => p !== "...");
      for (let j = 1; j < numbers.length; j++) {
        expect(numbers[j]!).toBeGreaterThan(numbers[j - 1]!);
      }
    }
  });
});

// ============================================================
// buildPageUrl
// ============================================================

describe("buildPageUrl", () => {
  it("builds URL with just page param when no searchParams", () => {
    expect(buildPageUrl(1, "/", {})).toBe("/?page=1");
  });

  it("builds URL with page 2", () => {
    expect(buildPageUrl(2, "/", {})).toBe("/?page=2");
  });

  it("preserves existing search param", () => {
    expect(buildPageUrl(3, "/", { search: "react" })).toBe(
      "/?search=react&page=3",
    );
  });

  it("overrides page param if already in searchParams", () => {
    expect(buildPageUrl(5, "/", { page: "1", search: "test" })).toBe(
      "/?page=5&search=test",
    );
  });

  it("works with a different baseUrl", () => {
    expect(buildPageUrl(2, "/blog", {})).toBe("/blog?page=2");
  });
});
