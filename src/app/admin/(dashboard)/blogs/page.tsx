import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { db } from "~/server/db";
import { blogs, comments } from "~/server/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { BlogStatusBadge } from "~/components/admin/BlogStatusBadge";

export default async function AdminBlogsPage() {
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
      status: blogs.status,
      viewCount: blogs.viewCount,
      createdAt: blogs.createdAt,
      commentCount: sql<number>`coalesce(${commentCounts.commentCount}, 0)`,
      pendingCommentCount:
        sql<number>`coalesce(${pendingCommentCounts.pendingCommentCount}, 0)`,
    })
    .from(blogs)
    .leftJoin(commentCounts, eq(commentCounts.blogId, blogs.id))
    .leftJoin(pendingCommentCounts, eq(pendingCommentCounts.blogId, blogs.id))
    .orderBy(desc(blogs.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">จัดการบทความ</h1>
        <Link href="/admin/blogs/new">
          <Button className="bg-sage hover:bg-sage/90 text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" /> สร้างบทความใหม่
          </Button>
        </Link>
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">ชื่อบทความ</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="text-right">เข้าชม</TableHead>
              <TableHead className="text-right">คอมเมนต์</TableHead>
              <TableHead>วันที่สร้าง</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {blogList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  ยังไม่มีบทความ
                </TableCell>
              </TableRow>
            ) : (
              blogList.map((blog) => (
                <TableRow key={blog.id}>
                  <TableCell className="font-medium">
                    {blog.title}
                    <div className="text-xs text-muted-foreground mt-1">/{blog.slug}</div>
                  </TableCell>
                  <TableCell>
                    <BlogStatusBadge status={blog.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {blog.viewCount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {blog.commentCount}
                    {blog.pendingCommentCount > 0 && (
                      <span className="ml-1 text-xs text-terracotta">
                        ({blog.pendingCommentCount} รอตรวจ)
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(blog.createdAt).toLocaleDateString("th-TH")}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Link href={`/admin/blogs/${blog.id}`}>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4 text-sage" />
                      </Button>
                    </Link>
                    <Link href={`/admin/blogs/${blog.id}/delete`}>
                      <Button variant="outline" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive hover:border-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
