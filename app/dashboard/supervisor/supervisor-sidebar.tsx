"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { ClipboardList } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";

const LINK_DEFS = [
  { href: "/dashboard/supervisor", labelKey: "nav.supervisor.orders", shortKey: "nav.supervisor.ordersShort", icon: ClipboardList },
] as const;

export function SupervisorSidebar() {
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
      <aside className="hidden md:flex md:w-56 md:shrink-0 md:flex-col md:border-l md:border-border md:bg-card md:p-3 md:gap-2 md:overflow-y-auto">
        {links.map((link) => {
          const isActive =
            pathname === "/dashboard/supervisor" || pathname.startsWith("/dashboard/supervisor/orders");
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
              <span>{link.label}</span>
            </Link>
          );
        })}
      </aside>

      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.35)]"
        aria-label={t("common.mainNavigation")}
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-center px-4 pt-1">
          {links.map((link) => {
            const isActive =
              pathname === "/dashboard/supervisor" || pathname.startsWith("/dashboard/supervisor/orders");
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex min-w-0 flex-1 max-w-[120px] flex-col items-center justify-center gap-0.5 rounded-t-lg px-2 py-2 text-center transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden />
                </span>
                <span className="text-[0.7rem] font-semibold">{link.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
