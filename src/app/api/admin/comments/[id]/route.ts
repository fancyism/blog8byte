import { type NextRequest } from "next/server";
import { apiUnauthorized, apiNotFound } from "~/lib/api-response";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/comments/:id
 *
 * Admin only — Approve or reject a comment (PENDING -> APPROVED | REJECTED)
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  // TODO: check admin session, validate status transition, update comment
  return apiUnauthorized();
}

/**
 * DELETE /api/admin/comments/:id
 *
 * Admin only — Delete a comment
 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  // TODO: check admin session, delete comment
  return apiUnauthorized();
}
