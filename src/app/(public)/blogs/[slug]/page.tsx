import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, count, eq } from "drizzle-orm";
import { ArrowLeft, Clock, MessageSquare } from "lucide-react";
import { BlogCommentsClient } from "~/components/blog/BlogCommentsClient";
import { BlogViewTracker } from "~/components/blog/BlogViewTracker";
import { ScrollReveal } from "~/components/shared/ScrollReveal";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { db } from "~/server/db";
import { blogImages, blogs, comments } from "~/server/db/schema";
import { CopyLinkButton } from "./CopyLinkButton";

type Params = { params: Promise<{ slug: string }> };

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await db
    .select({ slug: blogs.slug })
    .from(blogs)
    .where(eq(blogs.status, "published"));

  return slugs.map((blog) => ({ slug: blog.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const blog = await db.query.blogs.findFirst({
    where: and(eq(blogs.slug, slug), eq(blogs.status, "published")),
    columns: { title: true, excerpt: true, coverImage: true },
  });

  if (!blog) return { title: "Blog not found" };

  return {
    title: `${blog.title} | Blog8byte`,
    description: blog.excerpt ?? `อ่าน ${blog.title} บน Blog8byte`,
    openGraph: {
      title: blog.title,
      description: blog.excerpt ?? undefined,
      images: blog.coverImage ? [blog.coverImage] : undefined,
    },
  };
}

export default async function BlogDetailPage({ params }: Params) {
  const { slug } = await params;

  const blog = await db.query.blogs.findFirst({
    where: and(eq(blogs.slug, slug), eq(blogs.status, "published")),
  });

  if (!blog) notFound();

  const images = await db
    .select()
    .from(blogImages)
    .where(eq(blogImages.blogId, blog.id))
    .orderBy(asc(blogImages.displayOrder));

  const [approvedCommentCountResult] = await db
    .select({ value: count() })
    .from(comments)
    .where(and(eq(comments.blogId, blog.id), eq(comments.status, "approved")));

  const wordCount = blog.content.split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const approvedCommentCount = approvedCommentCountResult?.value ?? 0;
  const publishedDate = blog.publishedAt
    ? new Date(blog.publishedAt).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
      <BlogViewTracker slug={slug} />

      <ScrollReveal direction="down" className="w-fit">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ArrowLeft data-icon="inline-start" />
            กลับหน้าแรก
          </Link>
        </Button>
      </ScrollReveal>

      <div className="flex flex-col gap-5">
        <ScrollReveal className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">บทความเชิงเทคนิค</Badge>
          {publishedDate ? <Badge variant="outline">{publishedDate}</Badge> : null}
        </ScrollReveal>

        <ScrollReveal delay={0.05} className="flex flex-col gap-4">
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            {blog.title}
          </h1>
          {blog.excerpt ? (
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              {blog.excerpt}
            </p>
          ) : null}
        </ScrollReveal>

        <ScrollReveal delay={0.1} className="flex flex-wrap items-center gap-3">
          <Badge variant="outline">
            <Clock />
            {readingTime} นาทีอ่าน
          </Badge>
          <Badge variant="outline">
            <MessageSquare />
            {approvedCommentCount} ความเห็น
          </Badge>
          <Button asChild variant="outline" size="sm">
            <Link href="#comments">ไปที่ความคิดเห็น</Link>
          </Button>
          <CopyLinkButton />
        </ScrollReveal>
      </div>

      {blog.coverImage ? (
        <ScrollReveal delay={0.12}>
          <div className="relative aspect-[16/9] overflow-hidden rounded-[1.75rem] border border-border/80">
            <Image
              src={blog.coverImage}
              alt={blog.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        </ScrollReveal>
      ) : null}

      <ScrollReveal delay={0.16}>
        <div className="blog-content">{renderMarkdown(blog.content)}</div>
      </ScrollReveal>

      {images.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {images.map((image, index) => (
            <ScrollReveal key={image.id} delay={0.18 + index * 0.05}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-border/80">
                <Image
                  src={image.url}
                  alt={image.alt ?? "Blog image"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 384px"
                />
              </div>
            </ScrollReveal>
          ))}
        </div>
      ) : null}

      <Separator />

      <ScrollReveal delay={0.2}>
        <BlogCommentsClient blogSlug={slug} />
      </ScrollReveal>
    </article>
  );
}

function renderMarkdown(content: string) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index]!;

    if (line.startsWith("### ")) {
      elements.push(<h3 key={index}>{processInline(line.slice(4))}</h3>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={index}>{processInline(line.slice(3))}</h2>);
    } else if (line.startsWith("# ")) {
      elements.push(<h1 key={index}>{processInline(line.slice(2))}</h1>);
    } else if (/^---+$/.exec(line)) {
      elements.push(<hr key={index} />);
    } else if (line.startsWith("- ")) {
      const items: string[] = [];
      while (index < lines.length && lines[index]?.startsWith("- ")) {
        items.push(lines[index]!.slice(2));
        index++;
      }
      elements.push(
        <ul key={index}>
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{processInline(item)}</li>
          ))}
        </ul>,
      );
      continue;
    } else if (/^\d+\. /.exec(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\. /.exec(lines[index] ?? "")) {
        items.push(lines[index]!.replace(/^\d+\. /, ""));
        index++;
      }
      elements.push(
        <ol key={index}>
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{processInline(item)}</li>
          ))}
        </ol>,
      );
      continue;
    } else if (line.startsWith("> ")) {
      elements.push(<blockquote key={index}>{processInline(line.slice(2))}</blockquote>);
    } else if (line.trim() !== "") {
      elements.push(<p key={index}>{processInline(line)}</p>);
    }

    index++;
  }

  return elements;
}

function processInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }

    return part;
  });
}
