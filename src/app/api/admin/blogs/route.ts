/**
 * Admin Blog Management API
 *
 * GET  /api/admin/blogs — List all blogs (every status)
 * POST /api/admin/blogs — Create new blog
 *
 * Protected by middleware (admin only)
 */

import { type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { and, count, desc, eq, ilike, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { blogs, comments } from "~/server/db/schema";
import { auth } from "~/server/auth";
import {
  apiSuccess,
  apiUnauthorized,
  apiConflict,
  withErrorHandler,
} from "~/lib/with-error-handler";
import {
  blogListQuerySchema,
  createBlogSchema,
  getPaginationMeta,
} from "~/lib/validation";

/**
 * GET /api/admin/blogs — List all blogs with pagination
 */
export async function GET(request: NextRequest): Promise<Response> {
  const session = await auth();
  if (!session?.user) return apiUnauthorized();

  const url = new URL(request.url);
  const parsed = blogListQuerySchema.safeParse(
    Object.fromEntries(url.searchParams),
  );
  const { page = 1, limit = 10, search, status } = parsed.success
    ? parsed.data
    : { page: 1, limit: 10, search: undefined, status: undefined };

  const offset = (page - 1) * limit;

  const conditions = [];
  if (search) conditions.push(ilike(blogs.title, `%${search}%`));
  if (status) conditions.push(eq(blogs.status, status));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const commentCounts = db
    .select({
      blogId: comments.blogId,
      commentCount: sql<number>`count(${comments.id})::int`.as("commentCount"),
    })
    .from(comments)
    .groupBy(comments.blogId)
    .as("comment_counts");

  const pendingCommentCounts = db
    .select({
      blogId: comments.blogId,
      pendingCommentCount:
        sql<number>`count(${comments.id})::int`.as("pendingCommentCount"),
    })
    .from(comments)
    .where(eq(comments.status, "pending"))
    .groupBy(comments.blogId)
    .as("pending_comment_counts");

  const blogList = await db
    .select({
      id: blogs.id,
      title: blogs.title,
      slug: blogs.slug,
      excerpt: blogs.excerpt,
      coverImage: blogs.coverImage,
      status: blogs.status,
      viewCount: blogs.viewCount,
      createdAt: blogs.createdAt,
      updatedAt: blogs.updatedAt,
      publishedAt: blogs.publishedAt,
      commentCount: sql<number>`coalesce(${commentCounts.commentCount}, 0)`,
      pendingCommentCount:
        sql<number>`coalesce(${pendingCommentCounts.pendingCommentCount}, 0)`,
    })
    .from(blogs)
    .leftJoin(commentCounts, eq(commentCounts.blogId, blogs.id))
    .leftJoin(pendingCommentCounts, eq(pendingCommentCounts.blogId, blogs.id))
    .where(whereClause)
    .orderBy(desc(blogs.createdAt))
    .limit(limit)
    .offset(offset);

  const [totalResult] = await db
    .select({ count: count() })
    .from(blogs)
    .where(whereClause);

  const total = totalResult?.count ?? 0;

  return apiSuccess(blogList, { meta: getPaginationMeta(page, limit, total) });
}

/**
 * POST /api/admin/blogs — Create new blog
 */
export const POST = withErrorHandler(
  async ({ body }) => {
    const session = await auth();
    if (!session?.user) return apiUnauthorized();

    const data = body as {
      title: string;
      slug: string;
      content: string;
      excerpt?: string;
      coverImage?: string;
      status?: string;
    };

    // Check slug uniqueness
    const existing = await db.query.blogs.findFirst({
      where: eq(blogs.slug, data.slug),
      columns: { id: true },
    });
    if (existing) {
      return apiConflict(`Slug "${data.slug}" already exists`);
    }

    const [created] = await db
      .insert(blogs)
      .values({
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt,
        coverImage: data.coverImage,
        status: data.status ?? "draft",
        createdById: session.user.id,
        publishedAt: data.status === "published" ? new Date() : null,
      })
      .returning();

    if (!created) {
      return apiConflict("Failed to create blog");
    }

    revalidatePath("/", "page");
    if (created.status === "published") {
      revalidatePath(`/blogs/${created.slug}`, "page");
    }

    return apiSuccess(created);
  },
  { bodySchema: createBlogSchema },
);
