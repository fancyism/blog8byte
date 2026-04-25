/**
 * Footer - Minimal editorial footer.
 */
export function Footer() {
  return (
    <footer className="border-t border-border/80 bg-background/80">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex max-w-md flex-col gap-1">
          <p className="text-sm font-medium text-foreground">
            เขียนโค้ด เล่าเรื่อง และเก็บบันทึกทางเทคนิคแบบอ่านง่าย
          </p>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Blog8byte - Thai tech essays with a calmer editorial rhythm.
          </p>
        </div>
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground/70 sm:text-right">
          Next.js 15 / shadcn-ui / motion
        </p>
      </div>
    </footer>
  );
}
