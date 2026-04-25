import { desc, eq } from "drizzle-orm";
import {
  CommentListClient,
  type AdminComment,
  type CommentStatus,
} from "~/components/admin/CommentListClient";
import { db } from "~/server/db";
import { blogs, comments } from "~/server/db/schema";

export default async function AdminCommentsPage() {
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
    .orderBy(desc(comments.createdAt))
    .limit(100);

  const typedComments: AdminComment[] = commentList.map((comment) => ({
    ...comment,
    status: comment.status as CommentStatus,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">จัดการความคิดเห็น</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          แยกคอมเมนต์ออกเป็นโซนรอตรวจสอบ โซนที่อนุมัติแล้ว และโซนที่ปฏิเสธแล้ว
          เพื่อให้ทีมแอดมินตัดสินใจได้เร็วขึ้นและไม่สับสนระหว่างสถานะ
        </p>
      </div>

      <CommentListClient initialComments={typedComments} />
    </div>
  );
}
