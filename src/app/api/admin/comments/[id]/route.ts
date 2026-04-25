/**
 * Admin Comment Management by ID
 *
 * PATCH  /api/admin/comments/:id — Approve or reject
 * DELETE /api/admin/comments/:id — Hard delete
 *
 * Protected by middleware (admin only)
 */

import { type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { blogs, comments } from "~/server/db/schema";
import { auth } from "~/server/auth";
import {
  apiSuccess,
  apiNotFound,
  apiUnauthorized,
  apiBadRequest,
} from "~/lib/with-error-handler";
import { updateCommentStatusSchema } from "~/lib/validation";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/comments/:id — Approve or reject
 *
 * Valid transitions:
 *   pending  → approved ✅
 *   pending  → rejected ✅
 *   approved → rejected ✅
 *   rejected → approved ✅
 *   same     → same     ❌ (no-op)
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return apiUnauthorized();

  const { id } = await params;
  const commentId = parseInt(id, 10);
  if (isNaN(commentId)) return apiNotFound("Comment not found");

  const existing = await db.query.comments.findFirst({
    where: eq(comments.id, commentId),
    columns: { id: true, status: true, blogId: true },
  });
  if (!existing) return apiNotFound("Comment not found");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiBadRequest("Invalid JSON");
  }

  const parsed = updateCommentStatusSchema.safeParse(body);
  if (!parsed.success) {
    return apiBadRequest("Validation failed", {
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const newStatus = parsed.data.status;

  // No-op check
  if (existing.status === newStatus) {
    return apiBadRequest(`Comment is already "${newStatus}"`);
  }

  const [updated] = await db
    .update(comments)
    .set({ status: newStatus })
    .where(eq(comments.id, commentId))
    .returning();

  const blog = await db.query.blogs.findFirst({
    where: eq(blogs.id, existing.blogId),
    columns: { slug: true },
  });
  revalidatePath("/", "page");
  if (blog?.slug) {
    revalidatePath(`/blogs/${blog.slug}`, "page");
  }

  return apiSuccess(updated);
}

/**
 * DELETE /api/admin/comments/:id — Hard delete
 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return apiUnauthorized();

  const { id } = await params;
  const commentId = parseInt(id, 10);
  if (isNaN(commentId)) return apiNotFound("Comment not found");

  const existing = await db.query.comments.findFirst({
    where: eq(comments.id, commentId),
    columns: { id: true, blogId: true },
  });
  if (!existing) return apiNotFound("Comment not found");

  await db.delete(comments).where(eq(comments.id, commentId));

  const blog = await db.query.blogs.findFirst({
    where: eq(blogs.id, existing.blogId),
    columns: { slug: true },
  });
  revalidatePath("/", "page");
  if (blog?.slug) {
    revalidatePath(`/blogs/${blog.slug}`, "page");
  }

  return apiSuccess({ message: "Comment deleted" });
}
