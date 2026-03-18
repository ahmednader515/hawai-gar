"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Newspaper, BookOpen, Mail } from "lucide-react";

const links = [
  { href: "/dashboard/admin", label: "الطلبات", icon: ClipboardList },
  { href: "/dashboard/admin/news", label: "الأخبار", icon: Newspaper },
  { href: "/dashboard/admin/advisories", label: "الارشادات", icon: BookOpen },
  { href: "/dashboard/admin/contact", label: "معلومات التواصل", icon: Mail },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full max-w-[100vw] min-w-0 shrink-0 border-b border-border bg-card overflow-hidden md:w-64 md:flex-col md:h-full md:min-h-0 md:overflow-hidden md:overflow-y-hidden md:border-b-0 md:border-l">
      {/* Mobile: 2 columns grid (wrap to two rows) */}
      <div className="grid grid-cols-2 gap-px bg-gray-300 dark:bg-gray-600 md:hidden">
        {links.map((link) => {
          const isActive =
            link.href === "/dashboard/admin"
              ? pathname === "/dashboard/admin" || pathname.startsWith("/dashboard/admin/orders")
              : link.href === "/dashboard/admin/contact"
                ? pathname === "/dashboard/admin/contact"
                : pathname === link.href || pathname.startsWith(link.href + "/");
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center justify-center gap-2 px-2 py-3 text-center font-semibold text-sm transition-colors min-w-0 ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" aria-hidden />
              <span className="truncate">{link.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Desktop: vertical list */}
      <div className="hidden md:flex md:flex-col md:h-full md:min-h-0">
        {links.map((link, index) => {
          const isActive =
            link.href === "/dashboard/admin"
              ? pathname === "/dashboard/admin" || pathname.startsWith("/dashboard/admin/orders")
              : link.href === "/dashboard/admin/contact"
                ? pathname === "/dashboard/admin/contact"
                : pathname === link.href || pathname.startsWith(link.href + "/");
          const Icon = link.icon;
          return (
            <div key={link.href} className="min-w-0">
              {index > 0 ? (
                <div className="h-px w-full bg-gray-300 dark:bg-gray-600" aria-hidden />
              ) : null}
              <Link
                href={link.href}
                className={`w-full flex items-center justify-center gap-3 px-4 py-3 text-center font-semibold text-lg transition-colors min-w-0 ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <Icon className="w-6 h-6 shrink-0" aria-hidden />
                <span className="whitespace-normal truncate-none">{link.label}</span>
              </Link>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
