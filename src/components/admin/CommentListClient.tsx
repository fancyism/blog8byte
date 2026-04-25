"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Check,
  Clock3,
  ExternalLink,
  Loader2,
  MessageSquareDashed,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { cn } from "~/lib/utils";

export type CommentStatus = "pending" | "approved" | "rejected";

export interface AdminComment {
  id: number;
  blogId: number;
  blogTitle: string | null;
  blogSlug: string | null;
  parentId: number | null;
  authorName: string;
  content: string;
  status: CommentStatus;
  createdAt: string | Date;
}

interface CommentListProps {
  initialComments: AdminComment[];
}

interface ZoneConfig {
  key: CommentStatus;
  anchorId: string;
  eyebrow: string;
  title: string;
  description: string;
  countLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  tone: string;
}

const zoneConfigs: ZoneConfig[] = [
  {
    key: "pending",
    anchorId: "pending-zone",
    eyebrow: "moderation queue",
    title: "Pending Review",
    description:
      "คอมเมนต์ที่ต้องตัดสินใจตอนนี้ ควรอ่านและจัดการจากโซนนี้ก่อน",
    countLabel: "รอตรวจสอบ",
    emptyTitle: "ไม่มีคอมเมนต์ที่รอตรวจสอบ",
    emptyDescription:
      "เมื่อมีข้อความใหม่ที่ยังไม่ถูกตัดสินใจ ระบบจะแสดงในโซนนี้",
    tone: "border-amber-500/30 bg-amber-500/5",
  },
  {
    key: "approved",
    anchorId: "approved-zone",
    eyebrow: "accept zone",
    title: "Approved",
    description:
      "คอมเมนต์ที่เผยแพร่แล้ว แยกจากโซนอื่นเพื่อให้ตรวจซ้ำหรือย้อนกลับได้ง่าย",
    countLabel: "อนุมัติแล้ว",
    emptyTitle: "ยังไม่มีคอมเมนต์ที่อนุมัติแล้ว",
    emptyDescription: "คอมเมนต์ที่เผยแพร่แล้วจะถูกรวมไว้ในโซนนี้",
    tone: "border-sage/35 bg-sage/6",
  },
  {
    key: "rejected",
    anchorId: "rejected-zone",
    eyebrow: "deny zone",
    title: "Rejected",
    description:
      "คอมเมนต์ที่ถูกปฏิเสธ แยกออกชัดเจนเพื่อกันสับสนกับข้อความที่เผยแพร่แล้ว",
    countLabel: "ปฏิเสธแล้ว",
    emptyTitle: "ยังไม่มีคอมเมนต์ที่ถูกปฏิเสธ",
    emptyDescription: "ข้อความที่ถูก reject จะถูกรวมไว้ในโซนนี้เท่านั้น",
    tone: "border-destructive/25 bg-destructive/5",
  },
];

const pendingZone = zoneConfigs[0]!;
const approvedZone = zoneConfigs[1]!;
const rejectedZone = zoneConfigs[2]!;

export function CommentListClient({ initialComments }: CommentListProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const commentsByStatus = useMemo(
    () => ({
      pending: initialComments.filter((comment) => comment.status === "pending"),
      approved: initialComments.filter((comment) => comment.status === "approved"),
      rejected: initialComments.filter((comment) => comment.status === "rejected"),
    }),
    [initialComments],
  );

  const handleStatusChange = async (
    id: number,
    newStatus: Exclude<CommentStatus, "pending">,
  ) => {
    setLoadingId(id);

    try {
      const response = await fetch(`/api/admin/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        router.refresh();
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = confirm(
      "คุณแน่ใจหรือไม่ว่าต้องการลบความคิดเห็นนี้? การลบจะไม่สามารถกู้คืนได้",
    );
    if (!confirmed) return;

    setLoadingId(id);

    try {
      const response = await fetch(`/api/admin/comments/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      }
    } finally {
      setLoadingId(null);
    }
  };

  if (initialComments.length === 0) {
    return (
      <Empty className="rounded-xl border border-border bg-card py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MessageSquareDashed />
          </EmptyMedia>
          <EmptyTitle>ยังไม่มีความคิดเห็นในระบบ</EmptyTitle>
          <EmptyDescription>
            เมื่อมีคอมเมนต์เข้ามา ระบบ moderation จะแสดงรายการที่นี่
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {zoneConfigs.map((zone) => {
          const zoneComments = commentsByStatus[zone.key];

          return (
            <Card key={zone.key} size="sm" className={cn("py-0", zone.tone)}>
              <CardHeader className="py-4">
                <CardDescription className="text-xs uppercase tracking-[0.22em]">
                  {zone.eyebrow}
                </CardDescription>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-xl">{zoneComments.length}</CardTitle>
                  <Badge variant="outline">{zone.countLabel}</Badge>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <div className="sticky top-4 z-20 rounded-xl border border-border bg-background/95 p-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              moderation map
            </p>
            <p className="text-sm text-foreground/80">
              กระโดดไปแต่ละโซนได้ทันทีระหว่างคิวรอตรวจสอบ โซนอนุมัติ และโซนปฏิเสธ
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a href={`#${pendingZone.anchorId}`} className="inline-flex">
              <Badge variant="outline">
                {commentsByStatus.pending.length} รอตรวจสอบ
              </Badge>
            </a>
            <a href={`#${approvedZone.anchorId}`} className="inline-flex">
              <Badge variant="outline">
                {commentsByStatus.approved.length} อนุมัติแล้ว
              </Badge>
            </a>
            <a href={`#${rejectedZone.anchorId}`} className="inline-flex">
              <Badge variant="outline">
                {commentsByStatus.rejected.length} ปฏิเสธแล้ว
              </Badge>
            </a>
          </div>
        </div>
      </div>

      <ModerationZone
        zone={pendingZone}
        comments={commentsByStatus.pending}
        loadingId={loadingId}
        onApprove={handleStatusChange}
        onDelete={handleDelete}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <ModerationZone
          zone={approvedZone}
          comments={commentsByStatus.approved}
          loadingId={loadingId}
          onApprove={handleStatusChange}
          onDelete={handleDelete}
        />
        <ModerationZone
          zone={rejectedZone}
          comments={commentsByStatus.rejected}
          loadingId={loadingId}
          onApprove={handleStatusChange}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}

function ModerationZone({
  zone,
  comments,
  loadingId,
  onApprove,
  onDelete,
}: {
  zone: ZoneConfig;
  comments: AdminComment[];
  loadingId: number | null;
  onApprove: (id: number, nextStatus: "approved" | "rejected") => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  return (
    <section
      id={zone.anchorId}
      className={cn("scroll-mt-24 rounded-2xl border p-5", zone.tone)}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            {zone.eyebrow}
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">{zone.title}</h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {zone.description}
          </p>
        </div>
        <Badge variant="outline">{comments.length} รายการ</Badge>
      </div>

      {comments.length === 0 ? (
        <Empty className="border border-dashed border-border bg-card/60 py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageSquareDashed />
            </EmptyMedia>
            <EmptyTitle>{zone.emptyTitle}</EmptyTitle>
            <EmptyDescription>{zone.emptyDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentModerationCard
              key={comment.id}
              comment={comment}
              loadingId={loadingId}
              onApprove={onApprove}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CommentModerationCard({
  comment,
  loadingId,
  onApprove,
  onDelete,
}: {
  comment: AdminComment;
  loadingId: number | null;
  onApprove: (id: number, nextStatus: "approved" | "rejected") => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const isLoading = loadingId === comment.id;
  const formattedDate = new Date(comment.createdAt).toLocaleString("th-TH");
  const blogHref = comment.blogSlug ? `/blogs/${comment.blogSlug}` : null;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground">{comment.authorName}</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock3 className="size-3.5" />
              {formattedDate}
            </span>
            <StatusBadge status={comment.status} />
            {comment.parentId ? (
              <Badge variant="outline" className="text-xs">
                เป็นการตอบกลับ
              </Badge>
            ) : null}
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-sm leading-relaxed text-foreground/85">
            {comment.content}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>ในบทความ:</span>
            {blogHref ? (
              <Link
                href={blogHref}
                target="_blank"
                className="inline-flex items-center gap-1 font-medium text-foreground transition-colors hover:text-sage hover:underline"
              >
                {comment.blogTitle ?? "ไม่พบบทความ"}
                <ExternalLink className="size-3" />
              </Link>
            ) : (
              <span className="font-medium text-foreground/80">
                {comment.blogTitle ?? "ไม่พบบทความ"}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:w-40 lg:flex-col lg:items-stretch">
          {comment.status !== "approved" ? (
            <Button
              size="sm"
              variant="outline"
              className="text-sage hover:bg-sage/10 hover:text-sage"
              onClick={() => onApprove(comment.id, "approved")}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Check data-icon="inline-start" />
              )}
              อนุมัติ
            </Button>
          ) : null}

          {comment.status !== "rejected" ? (
            <Button
              size="sm"
              variant="outline"
              className="text-amber-700 hover:bg-amber-500/10 hover:text-amber-700"
              onClick={() => onApprove(comment.id, "rejected")}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <X data-icon="inline-start" />
              )}
              ปฏิเสธ
            </Button>
          ) : null}

          <Button
            size="sm"
            variant="outline"
            className="hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(comment.id)}
            disabled={isLoading}
          >
            <Trash2 data-icon="inline-start" />
            ลบ
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: CommentStatus }) {
  if (status === "pending") {
    return <Badge className="bg-amber-500 hover:bg-amber-600">รอตรวจสอบ</Badge>;
  }

  if (status === "approved") {
    return <Badge className="bg-sage hover:bg-sage">อนุมัติแล้ว</Badge>;
  }

  return <Badge variant="destructive">ปฏิเสธ</Badge>;
}
