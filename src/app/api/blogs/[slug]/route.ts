import { type NextRequest } from "next/server";
import { apiSuccess, apiNotFound } from "~/lib/api-response";

type Params = { params: Promise<{ slug: string }> };

/**
 * GET /api/blogs/:slug
 *
 * Public — Fetch blog detail by slug and increment view count
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { slug } = await params;

  // TODO: fetch blog by slug, increment viewCount
  return apiNotFound(`Blog not found: ${slug}`);
}
