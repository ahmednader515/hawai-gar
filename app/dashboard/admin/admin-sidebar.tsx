"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import {
  BarChart3,
  ClipboardList,
  Newspaper,
  BookOpen,
  Mail,
  Banknote,
  User,
  Users,
  FileText,
  ReceiptText,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useHorizontalScrollIndicator } from "@/components/use-horizontal-scroll-indicator";

const LINK_DEFS = [
  { href: "/dashboard/admin", labelKey: "nav.admin.orders", shortKey: "nav.admin.ordersShort", icon: ClipboardList },
  { href: "/dashboard/admin/clients", labelKey: "nav.admin.clients", shortKey: "nav.admin.clientsShort", icon: Users },
  { href: "/dashboard/admin/pricing", labelKey: "nav.admin.pricing", shortKey: "nav.admin.pricingShort", icon: Banknote },
  { href: "/dashboard/admin/points", labelKey: "nav.admin.points", shortKey: "nav.admin.pointsShort", icon: Star },
  { href: "/dashboard/admin/invoice", labelKey: "nav.admin.invoice", shortKey: "nav.admin.invoiceShort", icon: ReceiptText },
  { href: "/dashboard/admin/analytics", labelKey: "nav.admin.analytics", shortKey: "nav.admin.analyticsShort", icon: BarChart3 },
  { href: "/dashboard/admin/terms", labelKey: "nav.admin.terms", shortKey: "nav.admin.termsShort", icon: FileText },
  { href: "/dashboard/admin/news", labelKey: "nav.admin.news", shortKey: "nav.admin.newsShort", icon: Newspaper },
  { href: "/dashboard/admin/advisories", labelKey: "nav.admin.advisories", shortKey: "nav.admin.advisoriesShort", icon: BookOpen },
  { href: "/dashboard/admin/contact", labelKey: "nav.admin.contact", shortKey: "nav.admin.contactShort", icon: Mail },
  { href: "/dashboard/admin/account", labelKey: "nav.admin.account", shortKey: "nav.admin.accountShort", icon: User },
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
  if (href === "/dashboard/admin/points") {
    return pathname === "/dashboard/admin/points";
  }
  if (href === "/dashboard/admin/account") {
    return pathname === "/dashboard/admin/account";
  }
  if (href === "/dashboard/admin/clients") {
    return pathname === "/dashboard/admin/clients";
  }
  return pathname === href || pathname.startsWith(href + "/");
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { scrollerRef, showLeft, showRight, update } = useHorizontalScrollIndicator();
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
        <div ref={scrollerRef} onScroll={update} className="overflow-x-auto scrollbar-hide">
          <div className="mx-auto flex w-max min-w-full items-stretch gap-1 px-2 pt-1">
          {links.map((link) => {
            const isActive = linkActive(pathname, link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex min-w-[84px] shrink-0 flex-col items-center justify-center gap-1 rounded-t-xl px-2 py-2.5 text-center transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <Icon className="h-[22px] w-[22px] shrink-0" aria-hidden />
                </span>
                <span className="max-w-[5rem] truncate text-[0.72rem] font-semibold leading-tight">
                  {link.shortLabel}
                </span>
              </Link>
            );
          })}
          </div>
        </div>
        {showLeft ? (
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-1">
            <div className="absolute inset-y-0 start-0 w-8 bg-gradient-to-l from-transparent to-card/95" />
            <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-card/90 text-muted-foreground">
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </span>
          </div>
        ) : null}
        {showRight ? (
          <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-1">
            <div className="absolute inset-y-0 end-0 w-8 bg-gradient-to-r from-transparent to-card/95" />
            <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-card/90 text-muted-foreground">
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
            </span>
          </div>
        ) : null}
      </nav>
    </>
  );
}
