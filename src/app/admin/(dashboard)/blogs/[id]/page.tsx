import { notFound } from "next/navigation";
import { db } from "~/server/db";
import { blogs } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { BlogForm } from "~/components/admin/BlogForm";

type Params = { params: Promise<{ id: string }> };

export default async function EditBlogPage({ params }: Params) {
  const { id } = await params;
  const blogId = parseInt(id, 10);
  
  if (isNaN(blogId)) notFound();

  const blog = await db.query.blogs.findFirst({
    where: eq(blogs.id, blogId),
  });

  if (!blog) notFound();

  return <BlogForm initialData={blog} />;
}
