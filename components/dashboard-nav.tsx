"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

type Role = "ADMIN" | "SUPERVISOR" | "COMPANY" | "DRIVER";

const NAV_BY_ROLE: Record<
  Role,
  { href: string; label: string }[]
> = {
  ADMIN: [
    { href: "/dashboard/admin", label: "جميع الطلبات" },
    { href: "/dashboard/admin/news", label: "الأخبار" },
    { href: "/dashboard/admin/advisories", label: "إرشادات العملاء" },
    { href: "/dashboard/admin/contact", label: "معلومات التواصل" },
  ],
  SUPERVISOR: [
    { href: "/dashboard/supervisor", label: "الطلبات" },
  ],
  COMPANY: [
    { href: "/dashboard/company/orders", label: "طلباتي" },
    { href: "/dashboard/company/new-order", label: "انشاء طلب" },
  ],
  DRIVER: [
    { href: "/dashboard/client/requests", label: "الطلبات الواردة" },
    { href: "/dashboard/client/orders", label: "طلباتي" },
  ],
};

export function DashboardNav({
  role,
  email,
}: {
  role: Role;
  email: string | null;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navLinks = NAV_BY_ROLE[role] ?? [];

  return (
    <>
      {/* Mobile sidebar: overlay + panel (same pattern as homepage) */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ease-out ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!sidebarOpen}
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/50"
          aria-label="إغلاق القائمة"
          onClick={() => setSidebarOpen(false)}
        />
      </div>
      <aside
        className={`fixed top-0 bottom-0 right-0 z-50 w-72 max-w-[85vw] bg-card border-s border-border shadow-xl md:hidden flex flex-col transition-transform duration-300 ease-out will-change-transform ${
          sidebarOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
        aria-modal="true"
        role="dialog"
        aria-label="القائمة"
        aria-hidden={!sidebarOpen}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="font-semibold text-foreground">القائمة</span>
          <button
            type="button"
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-transform"
            aria-label="إغلاق"
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
              تسجيل الخروج
            </button>
          </div>
        </nav>
      </aside>

      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 gap-4 w-full max-w-full min-w-0">
          {/* Logo + nav links on desktop; on mobile only logo */}
          <nav className="flex items-center gap-4 md:gap-6 min-w-0">
            <Link href="/" className="flex items-center gap-2 font-semibold shrink-0">
              <Image src="/logo.png" alt="hawai GAR" width={28} height={28} className="object-contain" />
              <span className="hidden sm:inline">hawai GAR</span>
            </Link>
            {/* Desktop: show nav links */}
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
          </nav>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Desktop: logout */}
            <button
              type="button"
              className="hidden md:flex items-center justify-center gap-2 text-sm text-destructive hover:text-destructive/90 hover:underline transition-colors whitespace-nowrap"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="w-4 h-4 shrink-0" aria-hidden />
              تسجيل الخروج
            </button>

            {/* Mobile: menu button */}
            <div className="flex items-center md:hidden">
              <button
                type="button"
                className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                aria-label="فتح القائمة"
                aria-expanded={sidebarOpen}
                onClick={() => setSidebarOpen(true)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
