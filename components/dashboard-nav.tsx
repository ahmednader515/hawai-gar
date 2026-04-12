"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useI18n } from "@/components/providers/i18n-provider";
import { LanguageSwitcher } from "@/components/language-switcher";

type Role = "ADMIN" | "SUPERVISOR" | "COMPANY" | "DRIVER";

const NAV_BY_ROLE: Record<Role, { href: string; labelKey: string }[]> = {
  ADMIN: [],
  SUPERVISOR: [{ href: "/dashboard/supervisor", labelKey: "nav.dashboard.orders" }],
  COMPANY: [
    { href: "/dashboard/company/orders", labelKey: "nav.dashboard.myOrders" },
    { href: "/dashboard/company/new-order", labelKey: "nav.dashboard.newOrder" },
  ],
  /** Client (driver): no top-nav links — use client sidebar / bottom nav only */
  DRIVER: [],
};

function logoutButtonClassName(variant: "header" | "mobileHeader") {
  if (variant === "mobileHeader") {
    return "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-muted hover:text-destructive transition-colors min-h-[44px] min-w-[44px]";
  }
  return "hidden md:flex items-center justify-center gap-2 text-sm text-destructive hover:text-destructive/90 hover:underline transition-colors whitespace-nowrap";
}

export function DashboardNav({
  role,
  email,
}: {
  role: Role;
  email: string | null;
}) {
  const { t } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navLinks = useMemo(
    () =>
      (NAV_BY_ROLE[role] ?? []).map((item) => ({
        href: item.href,
        label: t(item.labelKey),
      })),
    [role, t],
  );
  const hasNavLinks = navLinks.length > 0;

  return (
    <>
      {/* Mobile sidebar: only when there are links to show (e.g. supervisor, driver) */}
      {hasNavLinks ? (
        <>
          <div
            className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ease-out ${
              sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-hidden={!sidebarOpen}
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/50"
              aria-label={t("common.closeMenu")}
              onClick={() => setSidebarOpen(false)}
            />
          </div>
          <aside
            className={`fixed top-0 bottom-0 right-0 z-50 w-72 max-w-[85vw] bg-card border-s border-border shadow-xl md:hidden flex flex-col transition-transform duration-300 ease-out will-change-transform ${
              sidebarOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
            }`}
            aria-modal="true"
            role="dialog"
            aria-label={t("common.menu")}
            aria-hidden={!sidebarOpen}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="min-w-0">
                <div className="font-semibold text-foreground">{t("common.menu")}</div>
                {email && <div className="text-xs text-muted-foreground truncate mt-0.5">{email}</div>}
              </div>
              <button
                type="button"
                className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-transform"
                aria-label={t("common.close")}
                onClick={() => setSidebarOpen(false)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col p-4 gap-1 overflow-y-auto flex-1">
              {navLinks.map((item) => (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className="py-3 px-3 rounded-lg text-foreground hover:bg-muted active:bg-muted transition-colors min-h-[44px] flex items-center"
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-border mt-2 pt-4">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 py-3 px-3 rounded-lg w-full text-destructive hover:text-destructive/90 hover:bg-muted/50 transition-colors"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="w-4 h-4 shrink-0" aria-hidden />
                  {t("common.logout")}
                </button>
              </div>
            </nav>
          </aside>
        </>
      ) : null}

      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 gap-4 w-full max-w-full min-w-0">
          <nav className="flex items-center gap-4 md:gap-6 min-w-0">
            <Link href="/" className="flex items-center gap-2 font-semibold shrink-0">
              <Image src="/logo.png" alt="Hawai Logisti" width={28} height={28} className="object-contain" />
              <span className="hidden sm:inline">Hawai Logisti</span>
            </Link>
            {hasNavLinks ? (
              <div className="hidden md:flex items-center gap-4 md:gap-6">
                {navLinks.map((item) => (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    className="text-sm text-foreground hover:text-foreground/80 transition-colors whitespace-nowrap"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </nav>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <LanguageSwitcher variant="default" />
            {/* Desktop: logout */}
            <button
              type="button"
              className={logoutButtonClassName("header")}
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="w-4 h-4 shrink-0" aria-hidden />
              {t("common.logout")}
            </button>

            {/* Mobile: قائمة — فقط إن وُجدت روابط في النافبار */}
            {hasNavLinks ? (
              <div className="flex items-center md:hidden">
                <button
                  type="button"
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                  aria-label={t("common.openMenu")}
                  aria-expanded={sidebarOpen}
                  onClick={() => setSidebarOpen(true)}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={`${logoutButtonClassName("mobileHeader")} md:hidden`}
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="w-5 h-5 shrink-0" aria-hidden />
                <span className="text-sm">{t("common.logout")}</span>
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
