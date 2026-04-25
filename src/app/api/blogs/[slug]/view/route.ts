import { type NextRequest } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { blogs } from "~/server/db/schema";
import { apiNotFound, apiSuccess } from "~/lib/with-error-handler";

type Params = { params: Promise<{ slug: string }> };

export async function POST(_request: NextRequest, { params }: Params) {
  const { slug } = await params;

  const [updated] = await db
    .update(blogs)
    .set({ viewCount: sql`${blogs.viewCount} + 1` })
    .where(and(eq(blogs.slug, slug), eq(blogs.status, "published")))
    .returning({ id: blogs.id, viewCount: blogs.viewCount });

  if (!updated) {
    return apiNotFound("Blog not found");
  }

  return apiSuccess(updated);
}
