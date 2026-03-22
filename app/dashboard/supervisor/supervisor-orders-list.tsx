"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DashboardListSearch } from "@/components/dashboard-list-search";
import { AR_LOCALE_LATN } from "@/lib/locale";
import { CopyableRequestId } from "@/components/copyable-request-id";

const statusLabels: Record<string, string> = {
  PENDING_APPROVAL: "في انتظار موافقة الإدارة",
  PENDING_DRIVER: "في انتظار رد شركة النقل",
  ACCEPTED: "مقبول",
  IN_PROGRESS: "قيد التنفيذ",
  DONE: "منتهي",
  REFUSED: "مرفوض",
  CANCELLED: "ملغى",
};

export type SupervisorOrderRow = {
  id: string;
  status: string;
  createdAt: string;
  fromName: string;
  toName: string;
  companyName: string | null;
  carrierName: string | null;
  carPlate: string | null;
};

function matches(q: string, o: SupervisorOrderRow) {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  const hay = [
    o.id,
    o.fromName,
    o.toName,
    o.companyName,
    o.carrierName,
    o.carPlate,
    statusLabels[o.status] ?? o.status,
    new Date(o.createdAt).toLocaleDateString(AR_LOCALE_LATN),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(s);
}

export function SupervisorOrdersList({ rows }: { rows: SupervisorOrderRow[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => rows.filter((r) => matches(q, r)), [rows, q]);

  if (rows.length === 0) {
    return <p className="text-muted-foreground">لا توجد طلبات.</p>;
  }

  return (
    <>
      <DashboardListSearch value={q} onChange={setQ} placeholder="ابحث برقم الطلب، المسار، الشركة، الحالة…" />
      {filtered.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
          لا توجد نتائج مطابقة للبحث.
        </p>
      ) : (
        <div className="space-y-4 min-w-0 w-full overflow-hidden">
          {filtered.map((o) => {
            const detailsHref = `/dashboard/supervisor/orders/${o.id}`;
            const detailsBtnClass =
              "inline-flex w-full min-h-[48px] items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90";
            return (
            <Card key={o.id} className="min-w-0 w-full overflow-hidden border border-border shadow-sm max-md:rounded-2xl">
              <CardHeader className="space-y-3 pb-3 max-md:px-3 max-md:pt-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-2 w-full">
                    <p className="text-xs font-medium text-muted-foreground">مسار الطلب</p>
                    <p className="text-base font-semibold leading-snug break-words">
                      من {o.fromName} → إلى {o.toName}
                    </p>
                    <CopyableRequestId id={o.id} compact />
                  </div>
                  <div className="hidden sm:flex flex-col gap-2 items-end shrink-0">
                    <span className="inline-flex w-fit max-w-full rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium">
                      {statusLabels[o.status] ?? o.status}
                    </span>
                    <Link href={detailsHref} className={`${detailsBtnClass} sm:w-auto`}>
                      عرض التفاصيل
                    </Link>
                  </div>
                  <div className="sm:hidden">
                    <span className="inline-flex w-fit max-w-full rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium">
                      {statusLabels[o.status] ?? o.status}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 border-t border-border max-md:px-3 max-md:pb-3">
                <dl className="grid grid-cols-1 gap-3 pt-4 text-sm sm:grid-cols-2">
                  <div className="rounded-lg bg-muted/40 p-3">
                    <dt className="text-xs font-medium text-muted-foreground">الشركة</dt>
                    <dd className="mt-1 font-medium break-words">{o.companyName ?? "—"}</dd>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3">
                    <dt className="text-xs font-medium text-muted-foreground">شركة النقل</dt>
                    <dd className="mt-1 font-medium break-words">
                      {o.carrierName ?? "—"}
                      {o.carPlate ? <span className="text-muted-foreground"> ({o.carPlate})</span> : null}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3 sm:col-span-2">
                    <dt className="text-xs font-medium text-muted-foreground">تاريخ الإنشاء</dt>
                    <dd className="mt-1 font-medium">
                      {new Date(o.createdAt).toLocaleDateString(AR_LOCALE_LATN)}
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 border-t border-border pt-4 sm:hidden">
                  <Link href={detailsHref} className={detailsBtnClass}>
                    عرض التفاصيل
                  </Link>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
