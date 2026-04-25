"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { CommentSection } from "~/components/blog/CommentSection";

interface Comment {
  id: number;
  authorName: string;
  content: string;
  createdAt: string;
  parentId: number | null;
  replies?: Comment[];
}

interface CommentsResponse {
  data?: {
    comments: Comment[];
  };
  error?: {
    message?: string;
  };
}

export function BlogCommentsClient({ blogSlug }: { blogSlug: string }) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadComments = async () => {
      try {
        const response = await fetch(`/api/blogs/${blogSlug}/comments`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as CommentsResponse;

        if (!response.ok || !payload.data) {
          throw new Error(payload.error?.message ?? "Failed to load comments");
        }

        if (active) {
          setComments(payload.data.comments);
        }
      } catch (fetchError) {
        if (active) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Failed to load comments",
          );
        }
      }
    };

    void loadComments();

    return () => {
      active = false;
    };
  }, [blogSlug]);

  if (error) {
    return (
      <Alert variant="destructive">
        <MessageSquare />
        <AlertTitle>โหลดความคิดเห็นไม่สำเร็จ</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (comments === null) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border/80 bg-card/60 px-4 py-5 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        กำลังโหลดความคิดเห็น...
      </div>
    );
  }

  return <CommentSection blogSlug={blogSlug} comments={comments} />;
}
