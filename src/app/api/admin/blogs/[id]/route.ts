import { type NextRequest } from "next/server";
import { apiSuccess, apiUnauthorized, apiNotFound } from "~/lib/api-response";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/blogs/:id
 *
 * Admin only — Fetch blog detail by ID
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  // TODO: check admin session, fetch blog by id
  return apiNotFound(`Blog not found: ${id}`);
}

/**
 * PUT /api/admin/blogs/:id
 *
 * Admin only — Update blog (title, content, slug, category, images)
 */
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  // TODO: check admin session, validate body, update blog
  return apiUnauthorized();
}

/**
 * PATCH /api/admin/blogs/:id
 *
 * Admin only — Update blog status (draft -> published)
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  // TODO: check admin session, update status
  return apiUnauthorized();
}

/**
 * DELETE /api/admin/blogs/:id
 *
 * Admin only — Delete a blog post
 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  // TODO: check admin session, soft delete or hard delete
  return apiUnauthorized();
}
