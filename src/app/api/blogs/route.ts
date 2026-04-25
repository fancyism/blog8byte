/**
 * GET /api/blogs
 *
 * Public — List published blogs with pagination and search.
 * Only returns published blogs. Content is excluded from list view.
 */

import { and, count, desc, eq, ilike, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { blogs, comments } from "~/server/db/schema";
import { apiSuccess, getHandler } from "~/lib/with-error-handler";
import { blogListQuerySchema, getPaginationMeta, type BlogListQuery } from "~/lib/validation";

export const GET = getHandler<BlogListQuery>(async ({ query }) => {
  const { page, limit, search } = query;
  const offset = (page - 1) * limit;

  // Build where conditions — public API always filters published only
  const conditions = [eq(blogs.status, "published")];
  if (search) {
    conditions.push(ilike(blogs.title, `%${search}%`));
  }
  const whereClause = and(...conditions);
  const approvedCommentCounts = db
    .select({
      blogId: comments.blogId,
      commentCount: sql<number>`count(${comments.id})::int`.as("commentCount"),
    })
    .from(comments)
    .where(eq(comments.status, "approved"))
    .groupBy(comments.blogId)
    .as("approved_comment_counts");

  // Fetch blogs with comment count (approved only)
  const blogList = await db
    .select({
      id: blogs.id,
      title: blogs.title,
      slug: blogs.slug,
      excerpt: blogs.excerpt,
      coverImage: blogs.coverImage,
      viewCount: blogs.viewCount,
      publishedAt: blogs.publishedAt,
      commentCount: sql<number>`coalesce(${approvedCommentCounts.commentCount}, 0)`,
    })
    .from(blogs)
    .leftJoin(approvedCommentCounts, eq(approvedCommentCounts.blogId, blogs.id))
    .where(whereClause)
    .orderBy(desc(blogs.publishedAt))
    .limit(limit)
    .offset(offset);

  // Count total for pagination
  const [totalResult] = await db
    .select({ count: count() })
    .from(blogs)
    .where(whereClause);

  const total = totalResult?.count ?? 0;

  return apiSuccess(blogList, { meta: getPaginationMeta(page, limit, total) });
}, blogListQuerySchema);
