"use client";

/**
 * CommentSection - Comment list with reply threads and submission form.
 * Thai-only validation with real-time feedback.
 */

import { useMemo, useState, type FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle,
  MessageSquare,
  Reply,
  Send,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";

interface Comment {
  id: number;
  authorName: string;
  content: string;
  createdAt: string;
  parentId: number | null;
  replies?: Comment[];
}

interface CommentSectionProps {
  blogSlug: string;
  comments: Comment[];
}

const THAI_REGEX = /^[\u0E00-\u0E7F0-9\u0E50-\u0E59\s\n]+$/;
const NOOP = () => undefined;

export function CommentSection({ blogSlug, comments }: CommentSectionProps) {
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const totalComments = useMemo(
    () =>
      comments.reduce(
        (total, comment) => total + 1 + (comment.replies?.length ?? 0),
        0,
      ),
    [comments],
  );

  return (
    <section id="comments" className="mt-16 flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-border/80 bg-secondary p-2 text-foreground">
              <MessageSquare className="size-4" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-semibold tracking-tight">ความคิดเห็น</h2>
              <p className="text-sm text-muted-foreground">
                ทุกข้อความจะผ่านการตรวจสอบก่อนเผยแพร่เพื่อคงคุณภาพการสนทนา
              </p>
            </div>
          </div>
        </div>
        <Badge variant="outline">{totalComments} ความเห็น</Badge>
      </div>

      {comments.length === 0 ? (
        <Empty className="border border-border/80 bg-card/60 py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageSquare />
            </EmptyMedia>
            <EmptyTitle>ยังไม่มีความเห็นในบทความนี้</EmptyTitle>
            <EmptyDescription>
              เป็นคนแรกที่ฝากมุมมองหรือคำถามไว้ได้เลย แล้วทีมงานจะช่วยดูแลก่อนเผยแพร่
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={() => setReplyTo(comment.id)}
            />
          ))}
        </div>
      )}

      <CommentForm
        blogSlug={blogSlug}
        parentId={replyTo}
        onCancelReply={() => setReplyTo(null)}
        replyToName={
          replyTo ? comments.find((comment) => comment.id === replyTo)?.authorName : undefined
        }
      />
    </section>
  );
}

function CommentItem({
  comment,
  onReply,
  isReply = false,
}: {
  comment: Comment;
  onReply: () => void;
  isReply?: boolean;
}) {
  const formattedDate = new Date(comment.createdAt).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const authorInitial = comment.authorName.trim().charAt(0).toUpperCase();

  return (
    <div
      className={
        isReply
          ? "ml-6 flex flex-col gap-3 border-l border-border/80 pl-4 sm:ml-10"
          : "flex flex-col gap-3"
      }
    >
      <div className="rounded-2xl border border-border/80 bg-card/80 p-4">
        <div className="flex items-start gap-3">
          <Avatar size="sm">
            <AvatarFallback>{authorInitial || "?"}</AvatarFallback>
          </Avatar>

          <div className="flex flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {comment.authorName}
                </span>
                {isReply ? <Badge variant="outline">ตอบกลับ</Badge> : null}
              </div>
              <span className="text-xs text-muted-foreground">{formattedDate}</span>
            </div>

            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
              {comment.content}
            </p>

            {!isReply ? (
              <div>
                <Button type="button" variant="ghost" size="sm" onClick={onReply}>
                  <Reply data-icon="inline-start" />
                  ตอบกลับ
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 ? (
        <div className="flex flex-col gap-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={NOOP}
              isReply
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CommentForm({
  blogSlug,
  parentId,
  onCancelReply,
  replyToName,
}: {
  blogSlug: string;
  parentId: number | null;
  onCancelReply: () => void;
  replyToName?: string;
}) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (name.trim().length < 2) {
      nextErrors.name = "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร";
    }

    if (!content.trim()) {
      nextErrors.content = "กรุณาใส่ข้อความ";
    } else if (content.length > 1000) {
      nextErrors.content = "ข้อความยาวเกินกำหนด (สูงสุด 1,000 ตัวอักษร)";
    } else if (!THAI_REGEX.test(content)) {
      nextErrors.content = "ใส่ได้เฉพาะภาษาไทยและตัวเลขเท่านั้น";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setStatus("loading");

    try {
      const response = await fetch(`/api/blogs/${blogSlug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: name.trim(),
          content,
          ...(parentId ? { parentId } : {}),
        }),
      });

      if (response.ok) {
        setStatus("success");
        setErrors({});
        setName("");
        setContent("");
        onCancelReply();
        window.setTimeout(() => setStatus("idle"), 4000);
        return;
      }

      const data = (await response.json()) as { error?: { message?: string } };
      setStatus("error");
      setErrors({
        form:
          data?.error?.message ??
          "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง",
      });
    } catch {
      setStatus("error");
      setErrors({ form: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้" });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[1.75rem] border border-border/80 bg-card/80 p-5 sm:p-6"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold text-foreground">
              {parentId ? "ตอบกลับความคิดเห็น" : "ร่วมวงสนทนา"}
            </h3>
            <p className="text-sm text-muted-foreground">
              เขียนเป็นภาษาไทย ระบบจะส่งให้ผู้ดูแลตรวจสอบก่อนเผยแพร่
            </p>
          </div>
          {parentId && replyToName ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">ตอบกลับ {replyToName}</Badge>
              <Button type="button" variant="ghost" size="sm" onClick={onCancelReply}>
                ยกเลิก
              </Button>
            </div>
          ) : null}
        </div>

        {status === "success" ? (
          <Alert>
            <CheckCircle />
            <AlertTitle>ส่งความคิดเห็นสำเร็จ</AlertTitle>
            <AlertDescription>
              ระบบได้รับข้อความแล้ว และจะเผยแพร่หลังการตรวจสอบจากผู้ดูแล
            </AlertDescription>
          </Alert>
        ) : null}

        {errors.form ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>ยังส่งข้อความไม่ได้</AlertTitle>
            <AlertDescription>{errors.form}</AlertDescription>
          </Alert>
        ) : null}

        <FieldGroup>
          <Field data-invalid={Boolean(errors.name)}>
            <FieldLabel htmlFor="comment-name">ชื่อ</FieldLabel>
            <Input
              id="comment-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="ใส่ชื่อของคุณ"
              className="h-10"
              aria-invalid={Boolean(errors.name) || undefined}
            />
            {!errors.name ? (
              <FieldDescription>ชื่อจะแสดงคู่กับความคิดเห็นเมื่อผ่านการอนุมัติ</FieldDescription>
            ) : null}
            <FieldError>{errors.name}</FieldError>
          </Field>

          <Field data-invalid={Boolean(errors.content)}>
            <div className="flex items-center justify-between gap-3">
              <FieldLabel htmlFor="comment-content">ข้อความ</FieldLabel>
              <span className="text-xs text-muted-foreground">
                {content.length}/1,000
              </span>
            </div>
            <Textarea
              id="comment-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="เขียนความคิดเห็นของคุณที่นี่..."
              rows={5}
              className="min-h-28 resize-none"
              aria-invalid={Boolean(errors.content) || undefined}
            />
            {!errors.content ? (
              <FieldDescription>
                รองรับเฉพาะภาษาไทย ตัวเลข และการเว้นบรรทัดเพื่อคงคุณภาพข้อมูล
              </FieldDescription>
            ) : null}
            <FieldError>{errors.content}</FieldError>
          </Field>
        </FieldGroup>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            เมื่อส่งแล้ว ระบบจะจัดเก็บไว้ในสถานะรอตรวจสอบก่อนแสดงบนหน้าเว็บ
          </p>
          <Button type="submit" disabled={status === "loading"}>
            <Send data-icon="inline-start" />
            {status === "loading" ? "กำลังส่ง..." : "ส่งความคิดเห็น"}
          </Button>
        </div>
      </div>
    </form>
  );
}
