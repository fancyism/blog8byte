import { type NextRequest } from "next/server";
import { apiSuccess } from "~/lib/api-response";

/**
 * GET /api/blogs
 *
 * Public — List published blogs with pagination and search
 * Query params: page, limit, search, category
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "10");

  // TODO: implement blog listing with pagination
  return apiSuccess(
    { blogs: [], page, limit },
    { total: 0, totalPages: 0 },
  );
}
