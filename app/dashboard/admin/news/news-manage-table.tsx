"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { DashboardListSearch } from "@/components/dashboard-list-search";
import { Button } from "@/components/ui/button";
import { AR_LOCALE_LATN } from "@/lib/locale";
import { useI18n } from "@/components/providers/i18n-provider";

export type NewsTableRow = {
  id: string;
  titleAr: string;
  category: string;
  publishedAt: string;
};

function matches(q: string, r: NewsTableRow, dateLocale: string) {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  const hay = [r.id, r.titleAr, r.category, new Date(r.publishedAt).toLocaleDateString(dateLocale)]
    .join(" ")
    .toLowerCase();
  return hay.includes(s);
}

export function NewsManageTable({ items }: { items: NewsTableRow[] }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const dateLocale = locale === "ar" ? AR_LOCALE_LATN : "en-GB";
  const filtered = useMemo(() => items.filter((r) => matches(q, r, dateLocale)), [items, q, dateLocale]);

  async function handleDelete(id: string) {
    if (!window.confirm(t("dashboard.admin.tableDeleteConfirmNews"))) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/news/${id}`, { method: "DELETE" });
      if (!res.ok) {
        window.alert(t("dashboard.admin.tableDeleteError"));
        return;
      }
      router.refresh();
    } catch {
      window.alert(t("dashboard.admin.tableDeleteError"));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <DashboardListSearch
        value={q}
        onChange={setQ}
        placeholder={t("dashboard.admin.newsTableSearchPlaceholder")}
        id="admin-news-search"
      />
      <div className="rounded-lg border overflow-hidden overflow-x-auto min-w-0">
        <table className="w-full text-sm min-w-[400px]">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-right p-3 font-medium">{t("dashboard.admin.tableColTitle")}</th>
              <th className="text-right p-3 font-medium">{t("dashboard.admin.tableColCategory")}</th>
              <th className="text-right p-3 font-medium">{t("dashboard.admin.tableColDate")}</th>
              <th className="text-right p-3 font-medium">{t("dashboard.admin.tableColActions")}</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-muted-foreground">
                  {t("dashboard.admin.tableNoNews")}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-muted-foreground">
                  {t("dashboard.admin.tableNoSearchResults")}
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-3">{item.titleAr}</td>
                  <td className="p-3">{item.category}</td>
                  <td className="p-3">{new Date(item.publishedAt).toLocaleDateString(dateLocale)}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/dashboard/admin/news/${item.id}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {t("dashboard.admin.tableEdit")}
                      </Link>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="gap-1"
                        disabled={deletingId === item.id}
                        onClick={() => void handleDelete(item.id)}
                        aria-label={t("dashboard.admin.tableDelete")}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                        {deletingId === item.id ? t("dashboard.admin.tableDeleting") : t("dashboard.admin.tableDelete")}
                      </Button>
                    </div>
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
