"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DashboardListSearch } from "@/components/dashboard-list-search";
import { AR_LOCALE_LATN } from "@/lib/locale";
import { useI18n } from "@/components/providers/i18n-provider";

export type AdvisoryTableRow = {
  id: string;
  titleAr: string;
  publishedAt: string;
};

function matches(q: string, r: AdvisoryTableRow, dateLocale: string) {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  const hay = [r.id, r.titleAr, new Date(r.publishedAt).toLocaleDateString(dateLocale)]
    .join(" ")
    .toLowerCase();
  return hay.includes(s);
}

export function AdvisoriesManageTable({ items }: { items: AdvisoryTableRow[] }) {
  const { t, locale } = useI18n();
  const [q, setQ] = useState("");
  const dateLocale = locale === "ar" ? AR_LOCALE_LATN : "en-GB";
  const filtered = useMemo(() => items.filter((r) => matches(q, r, dateLocale)), [items, q, dateLocale]);

  return (
    <div className="space-y-4">
      <DashboardListSearch
        value={q}
        onChange={setQ}
        placeholder={t("dashboard.admin.advisoriesTableSearchPlaceholder")}
        id="admin-advisories-search"
      />
      <div className="rounded-lg border overflow-hidden overflow-x-auto min-w-0">
        <table className="w-full text-sm min-w-[320px]">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-right p-3 font-medium">{t("dashboard.admin.tableColTitle")}</th>
              <th className="text-right p-3 font-medium">{t("dashboard.admin.tableColDate")}</th>
              <th className="text-right p-3 font-medium">{t("dashboard.admin.tableColActions")}</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-6 text-center text-muted-foreground">
                  {t("dashboard.admin.tableNoAdvisories")}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-6 text-center text-muted-foreground">
                  {t("dashboard.admin.tableNoSearchResults")}
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-3">{item.titleAr}</td>
                  <td className="p-3">{new Date(item.publishedAt).toLocaleDateString(dateLocale)}</td>
                  <td className="p-3">
                    <Link
                      href={`/dashboard/admin/advisories/${item.id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {t("dashboard.admin.tableEdit")}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
