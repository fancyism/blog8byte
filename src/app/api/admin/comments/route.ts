import { type NextRequest } from "next/server";
import { apiSuccess, apiUnauthorized } from "~/lib/api-response";

/**
 * GET /api/admin/comments
 *
 * Admin only — List all comments with status filter and pagination
 * Query params: status, page, limit
 */
export async function GET(request: NextRequest) {
  // TODO: check admin session
  // TODO: fetch comments with status filter + pagination
  return apiSuccess({ comments: [] });
}
