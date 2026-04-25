/**
 * GET  /api/blogs/:slug/comments
 * POST /api/blogs/:slug/comments
 *
 * Public - Read approved threaded comments or submit a new pending comment.
 */

import { type NextRequest } from "next/server";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { blogs, comments } from "~/server/db/schema";
import {
  apiBadRequest,
  apiNotFound,
  apiSuccess,
} from "~/lib/with-error-handler";
import { createCommentSchema } from "~/lib/validation";

type Params = { params: Promise<{ slug: string }> };

async function getPublishedBlogId(slug: string) {
  return db.query.blogs.findFirst({
    where: and(eq(blogs.slug, slug), eq(blogs.status, "published")),
    columns: { id: true },
  });
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { slug } = await params;
  const blog = await getPublishedBlogId(slug);

  if (!blog) {
    return apiNotFound("Blog not found");
  }

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

  const threadedComments = approvedComments.map((comment) => ({
    ...comment,
    createdAt: comment.createdAt.toISOString(),
    replies: replies
      .filter((reply) => reply.parentId === comment.id)
      .map((reply) => ({ ...reply, createdAt: reply.createdAt.toISOString() })),
  }));

  return apiSuccess({ comments: threadedComments });
}

export async function POST(request: NextRequest, { params }: Params) {
  const { slug } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiBadRequest("Invalid JSON in request body");
  }

  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return apiBadRequest("Validation failed", {
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const blog = await getPublishedBlogId(slug);
  if (!blog) {
    return apiNotFound("Blog not found");
  }

  if (parsed.data.parentId) {
    const parentComment = await db.query.comments.findFirst({
      where: and(
        eq(comments.id, parsed.data.parentId),
        eq(comments.blogId, blog.id),
        eq(comments.status, "approved"),
      ),
      columns: { id: true },
    });

    if (!parentComment) {
      return apiBadRequest("Parent comment not found or not approved");
    }
  }

  await db.insert(comments).values({
    blogId: blog.id,
    authorName: parsed.data.authorName,
    content: parsed.data.content,
    parentId: parsed.data.parentId ?? null,
    status: "pending",
  });

  return apiSuccess(
    { message: "ส่งความคิดเห็นสำเร็จ รอการตรวจสอบจากผู้ดูแลระบบ" },
    undefined,
  );
}
