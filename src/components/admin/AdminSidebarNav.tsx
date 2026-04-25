"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LayoutDashboard, MessageSquare } from "lucide-react";
import { cn } from "~/lib/utils";

const navItems = [
  {
    href: "/admin",
    label: "ภาพรวม",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/admin/blogs",
    label: "บทความ",
    icon: FileText,
  },
  {
    href: "/admin/comments",
    label: "ความคิดเห็น",
    icon: MessageSquare,
  },
];

export function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
