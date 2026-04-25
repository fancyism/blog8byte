import Link from "next/link";
import { Button } from "~/components/ui/button";

/**
 * Header - Minimal editorial header.
 * Logo left, nav right, thin border bottom.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-6">
        <Link href="/" className="group flex min-w-0 flex-col">
          <span className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
            Earth Tone Editorial
          </span>
          <span className="text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-sage">
            Blog<span className="text-terracotta">8byte</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            หน้าแรก
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/login">แอดมิน</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
