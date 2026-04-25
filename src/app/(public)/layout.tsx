import { Header } from "~/components/shared/Header";
import { Footer } from "~/components/shared/Footer";

/**
 * Public layout — Header + content + footer.
 * All public pages (blog list, blog detail) share this layout.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top,rgba(132,156,138,0.18),transparent_54%),radial-gradient(circle_at_80%_18%,rgba(200,121,101,0.14),transparent_32%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-24 h-px bg-[linear-gradient(90deg,transparent,rgba(28,25,23,0.12),transparent)]"
      />
      <Header />
      <main className="relative flex-1">{children}</main>
      <Footer />
    </div>
  );
}
