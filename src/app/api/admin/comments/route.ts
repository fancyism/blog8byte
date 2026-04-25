/**
 * GET /api/admin/comments
 *
 * Admin — List all comments across all blogs.
 * Filterable by status and blogId.
 */

import { type NextRequest } from "next/server";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { comments, blogs } from "~/server/db/schema";
import { auth } from "~/server/auth";
import { apiSuccess, apiUnauthorized } from "~/lib/with-error-handler";
import { commentListQuerySchema, getPaginationMeta } from "~/lib/validation";

export async function GET(request: NextRequest): Promise<Response> {
  const session = await auth();
  if (!session?.user) return apiUnauthorized();

  const url = new URL(request.url);
  const parsed = commentListQuerySchema.safeParse(
    Object.fromEntries(url.searchParams),
  );
  const { page = 1, limit = 10, status, blogId } = parsed.success
    ? parsed.data
    : { page: 1, limit: 10, status: undefined, blogId: undefined };

  const offset = (page - 1) * limit;

  const conditions = [];
  if (status) conditions.push(eq(comments.status, status));
  if (blogId) conditions.push(eq(comments.blogId, blogId));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const commentList = await db
    .select({
      id: comments.id,
      blogId: comments.blogId,
      blogTitle: blogs.title,
      blogSlug: blogs.slug,
      parentId: comments.parentId,
      authorName: comments.authorName,
      content: comments.content,
      status: comments.status,
      createdAt: comments.createdAt,
    })
    .from(comments)
    .leftJoin(blogs, eq(comments.blogId, blogs.id))
    .where(whereClause)
    .orderBy(desc(comments.createdAt))
    .limit(limit)
    .offset(offset);

  const [totalResult] = await db
    .select({ count: count() })
    .from(comments)
    .where(whereClause);

  const total = totalResult?.count ?? 0;

  return apiSuccess(commentList, { meta: getPaginationMeta(page, limit, total) });
}
