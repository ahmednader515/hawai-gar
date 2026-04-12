"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/components/providers/i18n-provider";

export function PublicSiteFooter() {
  const { t } = useI18n();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t py-8 bg-muted/20 mt-auto">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Hawai Logisti" width={32} height={32} className="object-contain" />
          <p className="font-semibold">Hawai Logisti</p>
        </div>
        <nav className="flex gap-6 text-sm text-muted-foreground">
          <Link href="/login" className="hover:underline">
            {t("common.login")}
          </Link>
          <Link href="/register" className="hover:underline">
            {t("footer.register")}
          </Link>
        </nav>
      </div>
      <p className="text-center text-sm text-muted-foreground mt-4 px-2">
        {t("footer.copyright").replace("{year}", String(year))}
      </p>
    </footer>
  );
}
