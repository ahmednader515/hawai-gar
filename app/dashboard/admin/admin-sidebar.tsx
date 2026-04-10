"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { ClipboardList, Newspaper, BookOpen, Mail, Banknote } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";

const LINK_DEFS = [
  { href: "/dashboard/admin", labelKey: "nav.admin.orders", shortKey: "nav.admin.ordersShort", icon: ClipboardList },
  { href: "/dashboard/admin/pricing", labelKey: "nav.admin.pricing", shortKey: "nav.admin.pricingShort", icon: Banknote },
  { href: "/dashboard/admin/news", labelKey: "nav.admin.news", shortKey: "nav.admin.newsShort", icon: Newspaper },
  { href: "/dashboard/admin/advisories", labelKey: "nav.admin.advisories", shortKey: "nav.admin.advisoriesShort", icon: BookOpen },
  { href: "/dashboard/admin/contact", labelKey: "nav.admin.contact", shortKey: "nav.admin.contactShort", icon: Mail },
] as const;

function isAdminOrdersActive(pathname: string) {
  return (
    pathname === "/dashboard/admin" ||
    pathname.startsWith("/dashboard/admin/shipment-requests") ||
    pathname.startsWith("/dashboard/admin/orders")
  );
}

function linkActive(pathname: string, href: string) {
  if (href === "/dashboard/admin") return isAdminOrdersActive(pathname);
  if (href === "/dashboard/admin/contact") {
    return pathname === "/dashboard/admin/contact";
  }
  if (href === "/dashboard/admin/pricing") {
    return pathname === "/dashboard/admin/pricing";
  }
  return pathname === href || pathname.startsWith(href + "/");
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const links = useMemo(
    () =>
      LINK_DEFS.map((d) => ({
        href: d.href,
        label: t(d.labelKey),
        shortLabel: t(d.shortKey),
        icon: d.icon,
      })),
    [t],
  );

  return (
    <>
      {/* Desktop: compact side nav (normal item height) */}
      <aside className="hidden md:flex md:w-56 md:shrink-0 md:flex-col md:border-l md:border-border md:bg-card md:p-3 md:gap-2 md:overflow-y-auto">
        {links.map((link) => {
          const isActive = linkActive(pathname, link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-right text-base font-semibold transition-colors min-w-0 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" aria-hidden />
              <span className="leading-snug">{link.label}</span>
            </Link>
          );
        })}
      </aside>

      {/* Mobile: bottom app-style navigation */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.35)]"
        aria-label={t("common.mainNavigation")}
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-between gap-0 px-1 pt-1">
          {links.map((link) => {
            const isActive = linkActive(pathname, link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-t-lg px-1 py-2 text-center transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden />
                </span>
                <span className="max-w-[4.5rem] truncate text-[0.65rem] font-semibold leading-tight">
                  {link.shortLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
