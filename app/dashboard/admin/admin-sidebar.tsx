"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Newspaper, BookOpen, Mail, Package } from "lucide-react";

const links = [
  { href: "/dashboard/admin", label: "الطلبات", icon: ClipboardList },
  { href: "/dashboard/admin/news", label: "الأخبار", icon: Newspaper },
  { href: "/dashboard/admin/advisories", label: "الارشادات", icon: BookOpen },
  { href: "/dashboard/admin/shipment-requests", label: "طلبات الشحن", icon: Package },
  { href: "/dashboard/admin/contact", label: "معلومات التواصل", icon: Mail },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full max-w-[100vw] min-w-0 shrink-0 flex flex-row border-b border-border bg-card md:w-64 md:flex-col md:h-full md:min-h-0 md:overflow-hidden md:overflow-y-hidden md:border-b-0 md:border-l overflow-hidden">
      {links.flatMap((link, index) => {
        const isActive =
          link.href === "/dashboard/admin"
            ? pathname === "/dashboard/admin" || pathname.startsWith("/dashboard/admin/orders")
            : link.href === "/dashboard/admin/contact"
              ? pathname === "/dashboard/admin/contact"
              : pathname === link.href || pathname.startsWith(link.href + "/");
        const Icon = link.icon;
        return [
          index > 0 ? (
            <div
              key={`sep-${link.href}`}
              className="w-px md:w-full self-stretch md:self-auto md:h-px shrink-0 bg-gray-300 dark:bg-gray-600"
              aria-hidden
            />
          ) : null,
          <Link
            key={link.href}
            href={link.href}
            className={`flex-1 flex items-center justify-center gap-2 px-2 py-3 text-center font-semibold text-sm transition-colors min-w-0 md:min-w-0 md:min-h-0 md:gap-3 md:px-4 md:py-0 md:text-lg md:w-full ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            <Icon className="w-5 h-5 shrink-0 md:w-6 md:h-6" aria-hidden />
            <span className="truncate md:whitespace-normal md:truncate-none">{link.label}</span>
          </Link>,
        ];
      })}
    </aside>
  );
}
