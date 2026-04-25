import { Badge } from "~/components/ui/badge";

export function BlogStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "published":
      return <Badge className="bg-sage hover:bg-sage/80 text-primary-foreground">เผยแพร่แล้ว</Badge>;
    case "draft":
      return <Badge variant="secondary">แบบร่าง</Badge>;
    case "unpublished":
      return <Badge variant="outline" className="text-muted-foreground border-muted-foreground">ยกเลิกเผยแพร่</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}
