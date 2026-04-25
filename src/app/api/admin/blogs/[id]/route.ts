/**
 * Admin Blog CRUD by ID
 *
 * GET    /api/admin/blogs/:id — Blog detail
 * PUT    /api/admin/blogs/:id — Full update
 * PATCH  /api/admin/blogs/:id — Status change (publish/unpublish)
 * DELETE /api/admin/blogs/:id — Delete blog
 *
 * Protected by middleware (admin only)
 */

import { type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { blogs, blogImages } from "~/server/db/schema";
import { auth } from "~/server/auth";
import {
  apiSuccess,
  apiNotFound,
  apiUnauthorized,
  apiBadRequest,
  apiConflict,
} from "~/lib/with-error-handler";
import { updateBlogSchema, updateBlogStatusSchema } from "~/lib/validation";

type Params = { params: Promise<{ id: string }> };

function resolveBlogStatusUpdate(
  currentStatus: string,
  nextStatus: string,
  currentPublishedAt: Date | null,
) {
  const validTransitions: Record<string, string[]> = {
    draft: ["draft", "published"],
    published: ["published", "unpublished"],
    unpublished: ["unpublished", "published"],
  };

  if (!validTransitions[currentStatus]?.includes(nextStatus)) {
    return {
      ok: false as const,
      message: `Cannot transition from "${currentStatus}" to "${nextStatus}"`,
    };
  }

  const updateData: Record<string, unknown> = { status: nextStatus };
  if (nextStatus === "published" && !currentPublishedAt) {
    updateData.publishedAt = new Date();
  }
  if (nextStatus === "draft" || nextStatus === "unpublished") {
    updateData.publishedAt = currentPublishedAt;
  }

  return { ok: true as const, updateData };
}

async function getBlogById(id: string) {
  const blogId = parseInt(id, 10);
  if (isNaN(blogId)) return null;
  return db.query.blogs.findFirst({
    where: eq(blogs.id, blogId),
    with: { images: true },
  });
}

/**
 * GET /api/admin/blogs/:id
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return apiUnauthorized();

  const { id } = await params;
  const blog = await getBlogById(id);
  if (!blog) return apiNotFound(`Blog not found: ${id}`);

  return apiSuccess(blog);
}

/**
 * PUT /api/admin/blogs/:id — Full update
 *
 * Read-only fields enforced: createdAt, viewCount, publishedAt
 */
export async function PUT(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return apiUnauthorized();

  const { id } = await params;
  const blogId = parseInt(id, 10);
  if (isNaN(blogId)) return apiNotFound("Blog not found");

  const existing = await db.query.blogs.findFirst({
    where: eq(blogs.id, blogId),
    columns: { id: true, slug: true, status: true, publishedAt: true },
  });
  if (!existing) return apiNotFound("Blog not found");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiBadRequest("Invalid JSON");
  }

  const parsed = updateBlogSchema.safeParse(body);
  if (!parsed.success) {
    return apiBadRequest("Validation failed", {
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const data = parsed.data;

  // Slug uniqueness check (if changing slug)
  if (data.slug && data.slug !== existing.slug) {
    const slugConflict = await db.query.blogs.findFirst({
      where: eq(blogs.slug, data.slug),
      columns: { id: true },
    });
    if (slugConflict) {
      return apiConflict(`Slug "${data.slug}" already exists`);
    }
  }

  // Update blog (exclude read-only fields)
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
  if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
  if (data.status !== undefined) {
    const statusUpdate = resolveBlogStatusUpdate(
      existing.status,
      data.status,
      existing.publishedAt,
    );

    if (!statusUpdate.ok) {
      return apiBadRequest(statusUpdate.message);
    }

    Object.assign(updateData, statusUpdate.updateData);
  }

  const [updated] = await db
    .update(blogs)
    .set(updateData)
    .where(eq(blogs.id, blogId))
    .returning();

  if (!updated) {
    return apiNotFound("Blog not found");
  }

  revalidatePath("/", "page");
  revalidatePath(`/blogs/${existing.slug}`, "page");
  if (updated.slug && updated.slug !== existing.slug) {
    revalidatePath(`/blogs/${updated.slug}`, "page");
  }

  // Handle images if provided
  if (data.images) {
    // Delete existing images and re-insert
    await db.delete(blogImages).where(eq(blogImages.blogId, blogId));
    if (data.images.length > 0) {
      await db.insert(blogImages).values(
        data.images.map((img) => ({
          blogId,
          url: img.url,
          alt: img.alt,
          displayOrder: img.displayOrder,
        })),
      );
    }
  }

  return apiSuccess(updated);
}

/**
 * PATCH /api/admin/blogs/:id — Status transition
 *
 * State machine:
 *   draft        → published   ✅ (set publishedAt)
 *   published    → unpublished ✅
 *   unpublished  → published   ✅ (publishedAt unchanged)
 *   published    → draft       ❌
 *   unpublished  → draft       ❌
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return apiUnauthorized();

  const { id } = await params;
  const blogId = parseInt(id, 10);
  if (isNaN(blogId)) return apiNotFound("Blog not found");

  const existing = await db.query.blogs.findFirst({
    where: eq(blogs.id, blogId),
    columns: { id: true, status: true, publishedAt: true },
  });
  if (!existing) return apiNotFound("Blog not found");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiBadRequest("Invalid JSON");
  }

  const parsed = updateBlogStatusSchema.safeParse(body);
  if (!parsed.success) {
    return apiBadRequest("Validation failed", {
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const newStatus = parsed.data.status;
  const currentStatus = existing.status;
  const statusUpdate = resolveBlogStatusUpdate(
    currentStatus,
    newStatus,
    existing.publishedAt,
  );
  if (!statusUpdate.ok) {
    return apiBadRequest(statusUpdate.message);
  }

  const [updated] = await db
    .update(blogs)
    .set(statusUpdate.updateData)
    .where(eq(blogs.id, blogId))
    .returning();

  if (!updated) {
    return apiNotFound("Blog not found");
  }

  const blogWithSlug = await db.query.blogs.findFirst({
    where: eq(blogs.id, blogId),
    columns: { slug: true },
  });
  revalidatePath("/", "page");
  if (blogWithSlug?.slug) {
    revalidatePath(`/blogs/${blogWithSlug.slug}`, "page");
  }

  return apiSuccess(updated);
}

/**
 * DELETE /api/admin/blogs/:id — Hard delete
 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return apiUnauthorized();

  const { id } = await params;
  const blogId = parseInt(id, 10);
  if (isNaN(blogId)) return apiNotFound("Blog not found");

  const existing = await db.query.blogs.findFirst({
    where: eq(blogs.id, blogId),
    columns: { id: true, slug: true },
  });
  if (!existing) return apiNotFound("Blog not found");

  // Cascade delete (images + comments deleted via FK)
  await db.delete(blogs).where(eq(blogs.id, blogId));

  revalidatePath("/", "page");
  revalidatePath(`/blogs/${existing.slug}`, "page");

  return apiSuccess({ message: "Blog deleted" });
}
