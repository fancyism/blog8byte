"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ImagePlus,
  Images,
  Loader2,
  Save,
  Upload,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

interface BlogFormProps {
  initialData?: {
    id?: number;
    title: string;
    slug: string;
    content: string;
    excerpt: string | null;
    coverImage: string | null;
    status: string;
  };
}

type UploadPurpose = "cover" | "content";

interface UploadedAsset {
  key: string;
  url: string;
  alt: string;
  markdown: string;
  uploadedAt: string | null;
}

interface UploadResponse {
  data?: UploadedAsset;
  error?: {
    message?: string;
  };
}

interface UploadListResponse {
  data?: {
    items: UploadedAsset[];
  };
  error?: {
    message?: string;
  };
}

export function BlogForm({ initialData }: BlogFormProps) {
  const router = useRouter();
  const isEditing = !!initialData?.id;
  const coverUploadInputRef = useRef<HTMLInputElement>(null);
  const contentUploadInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingPurpose, setUploadingPurpose] = useState<UploadPurpose | null>(
    null,
  );
  const [recentUploads, setRecentUploads] = useState<UploadedAsset[]>([]);
  const [isGalleryLoading, setIsGalleryLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: initialData?.title ?? "",
    slug: initialData?.slug ?? "",
    content: initialData?.content ?? "",
    excerpt: initialData?.excerpt ?? "",
    coverImage: initialData?.coverImage ?? "",
    status: initialData?.status ?? "draft",
  });

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const generateSlug = () => {
    if (!formData.title) return;

    const slug = formData.title
      .toLowerCase()
      .trim()
      .replace(/[^\u0E00-\u0E7Fa-z0-9\s-]/g, "")
      .replace(/[\s-]+/g, "-");

    setFormData((prev) => ({ ...prev, slug }));
  };

  const insertMarkdownAtCursor = (markdown: string) => {
    const textarea = contentTextareaRef.current;
    if (!textarea) {
      setFormData((prev) => ({
        ...prev,
        content: prev.content ? `${prev.content}\n\n${markdown}` : markdown,
      }));
      return;
    }

    const selectionStart = textarea.selectionStart ?? formData.content.length;
    const selectionEnd = textarea.selectionEnd ?? formData.content.length;

    setFormData((prev) => {
      const nextContent =
        prev.content.slice(0, selectionStart) +
        markdown +
        prev.content.slice(selectionEnd);
      return { ...prev, content: nextContent };
    });
  };

  const mergeRecentUpload = (asset: UploadedAsset) => {
    setRecentUploads((prev) => {
      const next = [asset, ...prev.filter((item) => item.key !== asset.key)];
      return next.slice(0, 12);
    });
  };

  const loadRecentUploads = async () => {
    setIsGalleryLoading(true);

    try {
      const response = await fetch("/api/admin/uploads?limit=12", {
        cache: "no-store",
      });

      const payload = (await response.json()) as UploadListResponse;
      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message ?? "Failed to load uploads");
      }

      setRecentUploads(payload.data.items);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Failed to load uploads";
      setError(message);
    } finally {
      setIsGalleryLoading(false);
    }
  };

  useEffect(() => {
    void loadRecentUploads();
  }, []);

  const uploadImage = async (file: File, purpose: UploadPurpose) => {
    setUploadingPurpose(purpose);
    setError(null);

    try {
      const multipartData = new FormData();
      multipartData.append("file", file);

      const response = await fetch("/api/admin/uploads", {
        method: "POST",
        body: multipartData,
      });

      const payload = (await response.json()) as UploadResponse;
      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message ?? "Upload failed");
      }

      mergeRecentUpload(payload.data);

      if (purpose === "cover") {
        setFormData((prev) => ({ ...prev, coverImage: payload.data!.url }));
        return;
      }

      insertMarkdownAtCursor(payload.data.markdown);
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "An unexpected upload error occurred";
      setError(message);
    } finally {
      setUploadingPurpose(null);
      if (coverUploadInputRef.current) coverUploadInputRef.current.value = "";
      if (contentUploadInputRef.current) contentUploadInputRef.current.value = "";
    }
  };

  const handleUploadSelection =
    (purpose: UploadPurpose) => async (
      event: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const file = event.target.files?.[0];
      if (!file) return;
      await uploadImage(file, purpose);
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const url = isEditing ? `/api/admin/blogs/${initialData?.id}` : "/api/admin/blogs";
      const method = isEditing ? "PUT" : "POST";

      const payload = {
        ...formData,
        excerpt: formData.excerpt || null,
        coverImage: formData.coverImage || null,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) {
        throw new Error(data.error?.message ?? "Failed to save blog");
      }

      router.push("/admin/blogs");
      router.refresh();
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "An unexpected error occurred";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl space-y-8">
      <input
        ref={coverUploadInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUploadSelection("cover")}
      />
      <input
        ref={contentUploadInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUploadSelection("content")}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/blogs">
            <Button variant="outline" size="icon" type="button">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? "แก้ไขบทความ" : "สร้างบทความใหม่"}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="draft">แบบร่าง (Draft)</option>
            <option value="published">เผยแพร่ (Published)</option>
            {isEditing ? (
              <option value="unpublished">ยกเลิกเผยแพร่ (Unpublished)</option>
            ) : null}
          </select>

          <Button
            type="submit"
            disabled={isLoading || uploadingPurpose !== null}
            className="bg-sage text-primary-foreground hover:bg-sage/90"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            บันทึก
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/15 p-4 text-sm font-medium text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">หัวข้อบทความ</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="ใส่หัวข้อบทความของคุณ..."
              required
              className="py-6 text-lg font-medium"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="slug">Slug (URL)</Label>
              <button
                type="button"
                onClick={generateSlug}
                className="text-xs text-sage hover:underline"
              >
                สร้างจากหัวข้ออัตโนมัติ
              </button>
            </div>
            <Input
              id="slug"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              placeholder="my-awesome-blog-post"
              required
              pattern="^[a-z0-9-]+$"
              title="Only lowercase letters, numbers, and hyphens are allowed."
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="content">เนื้อหา (Markdown)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoading || uploadingPurpose !== null}
                onClick={() => contentUploadInputRef.current?.click()}
              >
                {uploadingPurpose === "content" ? (
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                ) : (
                  <ImagePlus data-icon="inline-start" />
                )}
                อัปโหลดรูปเข้าเนื้อหา
              </Button>
            </div>
            <Textarea
              ref={contentTextareaRef}
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="เขียนเนื้อหาบทความด้วย Markdown..."
              required
              className="min-h-[500px] font-mono text-sm leading-relaxed"
            />
            <p className="text-xs text-muted-foreground">
              ระบบจะอัปโหลดรูปไปที่ Cloudflare R2 และแทรก markdown image ลงในตำแหน่งเคอร์เซอร์ให้อัตโนมัติ
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="excerpt">บทนำ (Excerpt)</Label>
            <Textarea
              id="excerpt"
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              placeholder="สรุปสั้นๆ ให้ผู้อ่านรู้ว่าบทความนี้เกี่ยวกับอะไร..."
              className="h-32 resize-none"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="coverImage">รูปภาพหน้าปก</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoading || uploadingPurpose !== null}
                onClick={() => coverUploadInputRef.current?.click()}
              >
                {uploadingPurpose === "cover" ? (
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                ) : (
                  <Upload data-icon="inline-start" />
                )}
                อัปโหลด
              </Button>
            </div>
            <Input
              id="coverImage"
              name="coverImage"
              type="url"
              value={formData.coverImage}
              onChange={handleChange}
              placeholder="https://cdn.example.com/blogs/example.png"
            />
            <p className="text-xs text-muted-foreground">
              ใช้ public URL จาก Cloudflare R2/custom domain สำหรับรูปที่แสดงบนเว็บ
            </p>
            {formData.coverImage ? (
              <div className="mt-2 aspect-video w-full overflow-hidden rounded-md border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={formData.coverImage}
                  alt="Cover preview"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <section className="space-y-4 rounded-2xl border border-border bg-card/80 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Images className="size-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold tracking-tight">
                รูปที่อัปโหลดล่าสุด
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              เลือกรูปเดิมเพื่อใช้เป็นหน้าปกหรือแทรกลงในเนื้อหาซ้ำได้ทันที
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadRecentUploads()}
            disabled={isGalleryLoading || uploadingPurpose !== null}
          >
            {isGalleryLoading ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <Images data-icon="inline-start" />
            )}
            รีเฟรชรายการ
          </Button>
        </div>

        {isGalleryLoading ? (
          <div className="text-sm text-muted-foreground">กำลังโหลดรูปล่าสุด...</div>
        ) : recentUploads.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-background/60 p-6 text-sm text-muted-foreground">
            ยังไม่มีรูปใน storage bucket นี้
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentUploads.map((asset) => (
              <div
                key={asset.key}
                className="overflow-hidden rounded-xl border border-border bg-background/60"
              >
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.url}
                    alt={asset.alt}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-3 p-3">
                  <div className="space-y-1">
                    <p className="line-clamp-1 text-sm font-medium text-foreground">
                      {asset.alt}
                    </p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {asset.uploadedAt
                        ? new Date(asset.uploadedAt).toLocaleString("th-TH")
                        : asset.key}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, coverImage: asset.url }))
                      }
                    >
                      ใช้เป็นรูปปก
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertMarkdownAtCursor(asset.markdown)}
                    >
                      แทรกในเนื้อหา
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </form>
  );
}
