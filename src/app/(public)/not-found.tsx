import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — ไม่พบหน้าที่ค้นหา | Blog8byte",
};

/**
 * Custom 404 page — Editorial style.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="mb-2 text-7xl font-bold tracking-tighter text-foreground/10">
        404
      </h1>
      <h2 className="mb-4 text-xl font-semibold text-foreground">
        ไม่พบหน้าที่ค้นหา
      </h2>
      <p className="mb-8 max-w-md text-sm text-muted-foreground">
        หน้าที่คุณกำลังมองหาอาจถูกลบ เปลี่ยนชื่อ หรือยังไม่ได้เผยแพร่
      </p>
      <Link
        href="/"
        className="rounded-md bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
      >
        กลับหน้าแรก
      </Link>
    </div>
  );
}
