import { type NextRequest } from "next/server";
import { apiSuccess, apiBadRequest } from "~/lib/api-response";

type Params = { params: Promise<{ slug: string }> };

/**
 * GET /api/blogs/:slug/comments
 *
 * Public — Fetch approved comments for a specific blog
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { slug } = await params;

  // TODO: fetch approved comments for this blog
  return apiSuccess({ comments: [], blogSlug: slug });
}

/**
 * POST /api/blogs/:slug/comments
 *
 * Public — Submit a new comment (Thai-only validation, pending status)
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { slug } = await params;

  // TODO: validate text with Zod, create comment as PENDING
  return apiBadRequest("Not implemented yet");
}
