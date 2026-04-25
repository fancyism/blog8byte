import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Search, ArrowLeft, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "404 — ไม่พบหน้าที่ค้นหา | Blog8byte",
};

/**
 * Custom 404 page — Earth Tone Editorial style.
 * Combines empathetic UX storytelling with Shadcn components.
 */
export default function NotFound() {
  return (
    <div className="relative flex min-h-[75vh] flex-col items-center justify-center px-6 text-center overflow-hidden">
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03]">
        <span className="text-[15rem] sm:text-[20rem] md:text-[30rem] font-bold tracking-tighter text-foreground">
          404
        </span>
      </div>

      <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center">
        {/* Editorial Icon/Accent */}
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--sage)]/10 text-[var(--sage)]">
          <BookOpen className="h-8 w-8" strokeWidth={1.5} />
        </div>

        {/* Narrative Copy */}
        <h1 className="mb-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
          หน้ากระดาษที่หมึกยังไม่แห้ง
        </h1>
        <p className="mb-10 text-base md:text-lg text-muted-foreground leading-relaxed max-w-[90%]">
          บทความที่คุณกำลังตามหาอาจถูกย้ายไปจัดเก็บในคลังข้อมูล เปลี่ยนชื่อ 
          หรืออาจจะยังเขียนไม่เสร็จดี... ลองค้นหาเรื่องอื่นที่คุณสนใจแทนดูไหมครับ?
        </p>

        {/* Actionable Path: Search */}
        <div className="w-full max-w-md flex flex-col sm:flex-row items-center gap-3 mb-10">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="ค้นหาบทความอื่นๆ..." 
              className="w-full pl-10 h-12 bg-background border-border focus-visible:ring-[var(--sage)]"
              aria-label="Search articles"
            />
          </div>
          <Button className="w-full sm:w-auto h-12 px-6 bg-foreground text-background hover:bg-foreground/90 transition-colors">
            ค้นหา
          </Button>
        </div>

        {/* Wayfinding Links */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
          <Button asChild variant="outline" className="w-full sm:w-auto h-11 border-border hover:bg-[var(--sage)]/5 hover:text-[var(--sage)] transition-colors">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              กลับหน้าแรก
            </Link>
          </Button>
          <Button asChild variant="ghost" className="w-full sm:w-auto h-11 text-muted-foreground hover:text-foreground">
            <Link href="/blogs">
              อ่านบทความล่าสุด
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
