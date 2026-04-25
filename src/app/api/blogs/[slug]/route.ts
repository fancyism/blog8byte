/**
 * GET /api/blogs/:slug
 *
 * Public - Blog detail payload without side effects.
 */

import { type NextRequest } from "next/server";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { blogImages, blogs, comments } from "~/server/db/schema";
import { apiNotFound, apiSuccess } from "~/lib/with-error-handler";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { slug } = await params;

  const blog = await db.query.blogs.findFirst({
    where: and(eq(blogs.slug, slug), eq(blogs.status, "published")),
    columns: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      coverImage: true,
      viewCount: true,
      createdAt: true,
      publishedAt: true,
    },
  });

  if (!blog) {
    return apiNotFound("Blog not found");
  }

  const images = await db
    .select()
    .from(blogImages)
    .where(eq(blogImages.blogId, blog.id))
    .orderBy(asc(blogImages.displayOrder));

  const approvedComments = await db
    .select()
    .from(comments)
    .where(
      and(
        eq(comments.blogId, blog.id),
        eq(comments.status, "approved"),
        isNull(comments.parentId),
      ),
    )
    .orderBy(desc(comments.createdAt));

  const commentIds = approvedComments.map((comment) => comment.id);
  let replies: (typeof approvedComments) = [];
  if (commentIds.length > 0) {
    replies = await db
      .select()
      .from(comments)
      .where(
        and(
          eq(comments.blogId, blog.id),
          eq(comments.status, "approved"),
          sql`${comments.parentId} IN (${sql.join(commentIds.map((id) => sql`${id}`), sql`, `)})`,
        ),
      )
      .orderBy(asc(comments.createdAt));
  }

  const commentsWithReplies = approvedComments.map((comment) => ({
    ...comment,
    replies: replies.filter((reply) => reply.parentId === comment.id),
  }));

  const wordCount = blog.content.split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return apiSuccess({
    ...blog,
    readingTime,
    images,
    comments: commentsWithReplies,
  });
}
