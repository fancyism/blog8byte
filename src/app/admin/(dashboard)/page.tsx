import { db } from "~/server/db";
import { blogs, comments } from "~/server/db/schema";
import { count, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { FileText, MessageSquare, Eye } from "lucide-react";

export default async function AdminDashboardPage() {
  // Fetch overview stats
  const [blogCount] = await db.select({ value: count() }).from(blogs);
  const [publishedCount] = await db
    .select({ value: count() })
    .from(blogs)
    .where(eq(blogs.status, "published"));
    
  const [commentCount] = await db.select({ value: count() }).from(comments);
  const [pendingCount] = await db
    .select({ value: count() })
    .from(comments)
    .where(eq(comments.status, "pending"));

  // Calculate total views
  const blogsWithViews = await db.select({ viewCount: blogs.viewCount }).from(blogs);
  const totalViews = blogsWithViews.reduce((acc, curr) => acc + curr.viewCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">ภาพรวมระบบ</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Blogs Stat */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">บทความทั้งหมด</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blogCount?.value ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              เผยแพร่แล้ว {publishedCount?.value ?? 0} บทความ
            </p>
          </CardContent>
        </Card>

        {/* Comments Stat */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ความคิดเห็น</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{commentCount?.value ?? 0}</div>
            <p className="text-xs text-muted-foreground text-terracotta">
              รอตรวจสอบ {pendingCount?.value ?? 0} รายการ
            </p>
          </CardContent>
        </Card>

        {/* Views Stat */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ยอดเข้าชมรวม</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ครั้งตลอดชีพ
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
