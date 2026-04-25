"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BlogCard } from "~/components/blog/BlogCard";
import { BlogGrid } from "~/components/blog/BlogGrid";
import { BlogGridSkeleton } from "~/components/blog/BlogSkeleton";
import { Pagination } from "~/components/blog/Pagination";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "~/components/ui/empty";
import { Button } from "~/components/ui/button";
import { Link2Off } from "lucide-react";

interface BlogItem {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImage?: string | null;
  viewCount: number;
  commentCount: number;
  publishedAt: string | Date | null;
}

interface BlogFeedClientProps {
  initialBlogs: BlogItem[];
  initialTotalPages: number;
}

interface BlogListResponse {
  data?: BlogItem[];
  meta?: {
    totalPages?: number;
  };
  error?: {
    message?: string;
  };
}

export function BlogFeedClient({
  initialBlogs,
  initialTotalPages,
}: BlogFeedClientProps) {
  const searchParams = useSearchParams();
  const [blogs, setBlogs] = useState(initialBlogs);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const search = searchParams.get("search") ?? "";
  const isDefaultFeed = page === 1 && search === "";

  useEffect(() => {
    let active = true;

    if (isDefaultFeed) {
      setBlogs(initialBlogs);
      setTotalPages(initialTotalPages);
      setError(null);
      setIsLoading(false);
      return;
    }

    const loadBlogs = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("limit", "9");
        if (search) params.set("search", search);

        const response = await fetch(`/api/blogs?${params.toString()}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as BlogListResponse;

        if (!response.ok || !payload.data) {
          throw new Error(payload.error?.message ?? "Failed to load blog feed");
        }

        if (active) {
          setBlogs(payload.data);
          setTotalPages(payload.meta?.totalPages ?? 1);
        }
      } catch (fetchError) {
        if (active) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Failed to load blog feed",
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadBlogs();

    return () => {
      active = false;
    };
  }, [initialBlogs, initialTotalPages, isDefaultFeed, page, search]);

  if (isLoading) {
    return <BlogGridSkeleton count={6} />;
  }

  if (error) {
    return (
      <Empty className="border border-border/80 bg-card/60 py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Link2Off />
          </EmptyMedia>
          <EmptyTitle>โหลดบทความไม่สำเร็จ</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (blogs.length === 0) {
    return (
      <Empty className="border border-border/80 bg-card/60 py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Link2Off />
          </EmptyMedia>
          <EmptyTitle>
            {search ? "ไม่พบบทความที่ตรงกับคำค้นหา" : "ยังไม่มีบทความเผยแพร่"}
          </EmptyTitle>
          <EmptyDescription>
            {search
              ? `ลองเปลี่ยนคำค้นจาก "${search}" หรือกลับไปดูบทความทั้งหมด`
              : "เมื่อมีบทความใหม่ หน้าแรกนี้จะอัปเดตให้อัตโนมัติ"}
          </EmptyDescription>
        </EmptyHeader>
        {search ? (
          <Button asChild variant="outline">
            <a href="/">ล้างตัวกรองและกลับไปหน้าแรก</a>
          </Button>
        ) : null}
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <BlogGrid>
        {blogs.map((blog) => (
          <BlogCard
            key={blog.id}
            slug={blog.slug}
            title={blog.title}
            excerpt={blog.excerpt}
            coverImage={blog.coverImage}
            viewCount={blog.viewCount}
            commentCount={blog.commentCount}
            publishedAt={blog.publishedAt}
          />
        ))}
      </BlogGrid>

      {totalPages > 1 ? (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          searchParams={search ? { search } : {}}
        />
      ) : null}
    </div>
  );
}
