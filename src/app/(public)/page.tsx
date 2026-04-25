import { Suspense } from "react";
import type { Metadata } from "next";
import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { blogs, comments } from "~/server/db/schema";
import { BlogFeedClient } from "~/components/blog/BlogFeedClient";
import { BlogSearch } from "~/components/blog/BlogSearch";
import { ScrollReveal } from "~/components/shared/ScrollReveal";
import { Badge } from "~/components/ui/badge";

export const metadata: Metadata = {
  title: "Blog8byte - บล็อกเทคโนโลยี",
  description:
    "บล็อกเทคโนโลยีภาษาไทย เขียนโค้ด เล่าเรื่อง แชร์ประสบการณ์ Full-Stack Development",
};

export const revalidate = 300;

export default async function HomePage() {
  const limit = 9;
  const approvedCommentCounts = db
    .select({
      blogId: comments.blogId,
      commentCount: sql<number>`count(${comments.id})::int`.as("commentCount"),
    })
    .from(comments)
    .where(eq(comments.status, "approved"))
    .groupBy(comments.blogId)
    .as("approved_comment_counts");

  const initialBlogs = await db
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
    .where(eq(blogs.status, "published"))
    .orderBy(desc(blogs.publishedAt))
    .limit(limit);

  const [totalResult] = await db
    .select({ count: count() })
    .from(blogs)
    .where(eq(blogs.status, "published"));

  const total = totalResult?.count ?? 0;
  const initialTotalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12">
      <section className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-card/80 px-6 py-8 sm:px-8 sm:py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(132,156,138,0.18),transparent_38%),radial-gradient(circle_at_left_bottom,rgba(200,121,101,0.16),transparent_30%)]"
        />

        <div className="relative flex flex-col gap-8">
          <ScrollReveal className="flex flex-wrap items-center gap-2" direction="down">
            <Badge variant="secondary">Earth Tone Editorial</Badge>
            <Badge variant="outline">Thai Tech Essays</Badge>
          </ScrollReveal>

          <ScrollReveal delay={0.05} className="flex max-w-3xl flex-col gap-4">
            <div className="flex flex-col gap-3">
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
                บล็อกสายเทคนิคที่ให้จังหวะการอ่าน
                <span className="text-terracotta"> ชัดขึ้น </span>
                และเบาขึ้น
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Blog8byte คือพื้นที่รวมบทความภาษาไทยสำหรับคนทำเว็บและระบบ
                ที่อยากอ่านเนื้อหาลึกพอใช้งานจริง แต่ยังคงน้ำหนักแบบบรรณาธิการที่สะอาดและสงบ
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <ScrollReveal delay={0.08} className="flex flex-col gap-3">
        <Suspense>
          <BlogSearch />
        </Suspense>
      </ScrollReveal>

      <section id="latest" className="flex flex-col gap-6">
        <ScrollReveal delay={0.12} className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold tracking-tight">Latest stories</h2>
            <p className="text-sm text-muted-foreground">
              รายการบทความพร้อมอ่านจาก static shell และ dynamic search island
            </p>
          </div>
          <Badge variant="outline">{total.toLocaleString()} รายการ</Badge>
        </ScrollReveal>

        <Suspense>
          <BlogFeedClient
            initialBlogs={initialBlogs}
            initialTotalPages={initialTotalPages}
          />
        </Suspense>
      </section>
    </div>
  );
}
