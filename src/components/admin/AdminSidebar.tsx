import Link from "next/link";
import { LogOut } from "lucide-react";
import { AdminSidebarNav } from "~/components/admin/AdminSidebarNav";
import { signOut } from "~/server/auth";

export function AdminSidebar() {
  return (
    <aside className="hidden h-full w-64 flex-col border-r border-border bg-sidebar md:flex">
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <Link href="/admin" className="text-xl font-bold tracking-tight text-sidebar-primary">
          Admin<span className="text-terracotta">Panel</span>
        </Link>
      </div>

      <AdminSidebarNav />

      <div className="border-t border-sidebar-border p-4">
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/admin/login" });
          }}
        >
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            ออกจากระบบ
          </button>
        </form>
      </div>
    </aside>
  );
}
