"use client";

import Image from "next/image";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/components/providers/i18n-provider";

export function PublicSiteHeader() {
  const { t } = useI18n();
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 gap-3">
        <Link href="/" className="flex items-center gap-2 font-semibold min-w-0">
          <Image src="/logo.png" alt="hawai Logisti" width={32} height={32} className="object-contain shrink-0" />
          <span className="truncate">hawai Logisti</span>
        </Link>
        <div className="flex items-center gap-3 shrink-0">
          <LanguageSwitcher variant="default" />
          <Link href="/" className="text-sm text-muted-foreground hover:underline whitespace-nowrap">
            {t("publicPage.homeLink")}
          </Link>
        </div>
      </div>
    </header>
  );
}
