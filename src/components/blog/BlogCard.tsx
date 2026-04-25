"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock, Eye, MessageSquare } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";

interface BlogCardProps {
  slug: string;
  title: string;
  excerpt?: string | null;
  coverImage?: string | null;
  viewCount: number;
  commentCount: number;
  publishedAt: string | Date | null;
}

/**
 * BlogCard - Editorial card for blog list.
 *
 * Cover image with hover scale, measured metadata, and a cleaner action footer.
 */
export function BlogCard({
  slug,
  title,
  excerpt,
  coverImage,
  viewCount,
  commentCount,
  publishedAt,
}: BlogCardProps) {
  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const readingTime = Math.max(1, Math.ceil((excerpt?.length ?? 100) / 50));

  return (
    <Link href={`/blogs/${slug}`} className="group block h-full">
      <Card className="h-full py-0 transition-transform duration-500 hover:-translate-y-1">
        {coverImage ? (
          <div className="relative aspect-[16/10] overflow-hidden">
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/45 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3">
              <Badge variant="secondary">
                <Clock />
                {readingTime} นาทีอ่าน
              </Badge>
            </div>
          </div>
        ) : null}

        <CardContent className="flex h-full flex-col gap-4 pb-5 pt-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">บทความล่าสุด</Badge>
            <Badge variant="outline">{commentCount} ความเห็น</Badge>
            {formattedDate ? (
              <span className="ml-auto text-xs text-muted-foreground opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {formattedDate}
              </span>
            ) : null}
          </div>

          <div className="flex flex-1 flex-col gap-2">
            <h2 className="text-xl font-semibold leading-snug text-foreground transition-colors group-hover:text-sage">
              {title}
            </h2>
            {excerpt ? (
              <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {excerpt}
              </p>
            ) : null}
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Eye className="size-3.5" />
                {viewCount.toLocaleString()}
              </span>
              <span className="flex items-center gap-1.5">
                <MessageSquare className="size-3.5" />
                {commentCount}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
              อ่านต่อ
              <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
