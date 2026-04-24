import { type NextRequest } from "next/server";
import { apiSuccess, apiUnauthorized } from "~/lib/api-response";

/**
 * GET /api/admin/blogs
 *
 * Admin only — List all blogs (draft + published) with pagination
 */
export async function GET(request: NextRequest) {
  // TODO: check admin session
  // TODO: fetch all blogs with pagination
  return apiSuccess({ blogs: [] });
}

/**
 * POST /api/admin/blogs
 *
 * Admin only — Create a new blog post
 */
export async function POST(request: NextRequest) {
  // TODO: check admin session
  // TODO: validate body with Zod, create blog
  return apiUnauthorized();
}
