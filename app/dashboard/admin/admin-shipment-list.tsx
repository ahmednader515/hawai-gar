"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardListSearch } from "@/components/dashboard-list-search";
import { formatDashboardDateTime } from "@/lib/format-datetime";
import { CopyableRequestId } from "@/components/copyable-request-id";
import { SarPriceDisplay } from "@/components/sar-price-display";
import type { AppLocale } from "@/lib/i18n/config";
import { sarAmountInWords } from "@/lib/format-sar";
import { useI18n } from "@/components/providers/i18n-provider";

export type AdminShipmentRow = {
  id: string;
  fromText: string;
  toText: string;
  shipmentType: string | null;
  distanceKm: number | null;
  priceSar: number | null;
  carrierDecisionAt: string | null;
  adminDecisionAt: string | null;
  status: string;
  containerSize: string | null;
  containersCount: string | null;
  pickupDate: string | null;
  notes: string | null;
  companyName: string | null;
  carrierName: string | null;
  carPlate: string | null;
};

function rowMatches(
  q: string,
  r: AdminShipmentRow,
  t: (key: string) => string,
  locale: AppLocale,
): boolean {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  const statusKey = `shipmentRequestStatus.${r.status}`;
  const statusLabel = t(statusKey);
  const hay = [
    r.id,
    r.fromText,
    r.toText,
    r.shipmentType,
    r.containerSize,
    r.containersCount,
    r.pickupDate,
    r.notes,
    r.companyName,
    r.carrierName,
    r.carPlate,
    statusLabel,
    r.status,
    typeof r.distanceKm === "number" ? String(r.distanceKm) : "",
    typeof r.priceSar === "number" ? String(r.priceSar) : "",
    typeof r.priceSar === "number" ? sarAmountInWords(r.priceSar, locale) : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(s);
}

function shipmentStatusLabel(status: string, t: (key: string) => string) {
  const key = `shipmentRequestStatus.${status}`;
  const msg = t(key);
  return msg !== key ? msg : status;
}

/**
 * Filter chips (one row label per chip). `AWAITING_ADMIN` maps two DB statuses
 * so we don't show duplicate "awaiting admin" buttons.
 */
export const ADMIN_SHIPMENT_STATUS_FILTERS = [
  "PENDING_CARRIER",
  "AWAITING_ADMIN",
  "ADMIN_APPROVED",
  "AWAITING_PAYMENT_APPROVAL",
  "ADMIN_REJECTED",
  "COMPLETE",
] as const;

export type AdminShipmentStatusFilter = "all" | (typeof ADMIN_SHIPMENT_STATUS_FILTERS)[number];

function matchesStatusFilter(row: AdminShipmentRow, filter: AdminShipmentStatusFilter): boolean {
  if (filter === "all") return true;
  if (filter === "AWAITING_ADMIN") {
    return row.status === "CARRIER_ACCEPTED" || row.status === "CARRIER_REFUSED";
  }
  return row.status === filter;
}

function AdminShipmentDeleteButton({ requestId }: { requestId: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm(t("dashboard.admin.deleteShipmentRequestConfirm"))) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/shipment-requests/${requestId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data.error as string) ?? t("dashboard.admin.deleteShipmentRequestError"));
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full flex-col items-stretch gap-1 sm:items-end">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="min-h-[48px] w-full rounded-xl px-5 py-3 text-sm font-semibold sm:min-h-0 sm:w-auto"
        onClick={() => void handleDelete()}
        disabled={busy}
      >
        {busy ? t("dashboard.admin.deleteShipmentRequestDeleting") : t("dashboard.admin.deleteShipmentRequest")}
      </Button>
      {error ? (
        <p className="text-end text-xs text-red-700 sm:max-w-[20rem]">{error}</p>
      ) : null}
    </div>
  );
}

export function AdminShipmentList({ rows }: { rows: AdminShipmentRow[] }) {
  const { t, locale } = useI18n();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<AdminShipmentStatusFilter>("all");

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (!matchesStatusFilter(r, statusFilter)) return false;
        return rowMatches(q, r, t, locale);
      }),
    [rows, q, t, locale, statusFilter],
  );

  const dateLocaleKey = locale === "ar" ? "ar" : "en";

  if (rows.length === 0) {
    return <p className="text-muted-foreground">{t("dashboard.admin.noRequests")}</p>;
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-3">
        <DashboardListSearch
          value={q}
          onChange={setQ}
          placeholder={t("dashboard.admin.searchShipmentsPlaceholder")}
          id="admin-shipment-search"
        />
        {rows.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              {t("dashboard.client.filterByStatus")}
            </p>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label={t("dashboard.client.filterByStatus")}
            >
              <Button
                type="button"
                size="sm"
                variant={statusFilter === "all" ? "default" : "outline"}
                aria-pressed={statusFilter === "all"}
                className="h-auto min-h-8 max-w-full justify-center px-3 py-2 text-start leading-snug whitespace-normal sm:max-w-[min(100%,22rem)]"
                onClick={() => setStatusFilter("all")}
              >
                {t("dashboard.client.filterStatusAll")}
              </Button>
              {ADMIN_SHIPMENT_STATUS_FILTERS.map((s) => (
                <Button
                  key={s}
                  type="button"
                  size="sm"
                  variant={statusFilter === s ? "default" : "outline"}
                  aria-pressed={statusFilter === s}
                  className="h-auto min-h-8 max-w-full justify-center px-3 py-2 text-start leading-snug whitespace-normal sm:max-w-[min(100%,22rem)]"
                  onClick={() => setStatusFilter(s)}
                >
                  {shipmentStatusLabel(s, t)}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
          {t("dashboard.admin.noSearchResults")}
        </p>
      ) : (
        <div className="space-y-4 min-w-0 w-full overflow-hidden">
          {filtered.map((o) => {
            const when = o.adminDecisionAt
              ? formatDashboardDateTime(o.adminDecisionAt, dateLocaleKey)
              : o.carrierDecisionAt
                ? formatDashboardDateTime(o.carrierDecisionAt, dateLocaleKey)
                : "";
            const detailsHref = `/dashboard/admin/shipment-requests/${o.id}`;
            const detailsBtnClass =
              "inline-flex w-full min-h-[48px] items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90 active:scale-[0.99]";
            const statusText = shipmentStatusLabel(o.status, t);
            return (
              <Card
                key={o.id}
                className="min-w-0 w-full overflow-hidden border border-border shadow-sm max-md:rounded-2xl"
              >
                <CardHeader className="space-y-3 pb-3 sm:pb-4 max-md:px-3 max-md:pt-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0 space-y-2 w-full">
                      <p className="text-xs font-medium text-muted-foreground">{t("dashboard.admin.routeHeading")}</p>
                      <p className="text-base font-semibold leading-snug break-words">
                        {t("dashboard.admin.routeFromTo").replace("{from}", o.fromText).replace("{to}", o.toText)}
                      </p>
                      <CopyableRequestId id={o.id} compact />
                    </div>
                    <div className="hidden sm:flex flex-col gap-2 items-end shrink-0">
                      <span
                        suppressHydrationWarning
                        className="inline-flex w-fit max-w-full items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground"
                      >
                        {statusText}
                        {when ? ` — ${when}` : ""}
                      </span>
                      <div className="flex w-full min-w-0 flex-col items-end gap-2 sm:w-auto">
                        <Link href={detailsHref} className={`${detailsBtnClass} sm:w-auto`}>
                          {t("dashboard.admin.viewDetails")}
                        </Link>
                        <AdminShipmentDeleteButton requestId={o.id} />
                      </div>
                    </div>
                    <div className="sm:hidden">
                      <span
                        suppressHydrationWarning
                        className="inline-flex w-fit max-w-full items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground"
                      >
                        {statusText}
                        {when ? ` — ${when}` : ""}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 max-md:px-3 max-md:pb-3">
                  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 border-t border-border pt-4 text-sm">
                    <div className="rounded-lg bg-muted/40 p-3">
                      <dt className="text-xs font-medium text-muted-foreground">{t("dashboard.admin.company")}</dt>
                      <dd className="mt-1 font-medium break-words">{o.companyName ?? "—"}</dd>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3">
                      <dt className="text-xs font-medium text-muted-foreground">{t("dashboard.admin.carrier")}</dt>
                      <dd className="mt-1 font-medium break-words">
                        {o.carrierName ?? "—"}
                        {o.carPlate ? (
                          <span className="text-muted-foreground"> ({o.carPlate})</span>
                        ) : null}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3">
                      <dt className="text-xs font-medium text-muted-foreground">{t("dashboard.admin.shipmentType")}</dt>
                      <dd className="mt-1 font-medium">{o.shipmentType ?? "—"}</dd>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3">
                      <dt className="text-xs font-medium text-muted-foreground">{t("hero.distance")}</dt>
                      <dd className="mt-1 font-medium">
                        {typeof o.distanceKm === "number"
                          ? t("dashboard.admin.distanceKmShort").replace("{n}", o.distanceKm.toFixed(1))
                          : "—"}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3">
                      <dt className="text-xs font-medium text-muted-foreground">{t("dashboard.admin.price")}</dt>
                      <dd className="mt-1">
                        {typeof o.priceSar === "number" ? (
                          <SarPriceDisplay amount={o.priceSar} locale={locale} />
                        ) : (
                          "—"
                        )}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3">
                      <dt className="text-xs font-medium text-muted-foreground">{t("dashboard.admin.containerCount")}</dt>
                      <dd className="mt-1 font-medium break-words">
                        {o.containerSize ?? "—"} — {o.containersCount ?? "—"}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3 sm:col-span-2">
                      <dt className="text-xs font-medium text-muted-foreground">{t("dashboard.admin.pickupDate")}</dt>
                      <dd className="mt-1 font-medium">{o.pickupDate ?? "—"}</dd>
                    </div>
                    {o.notes ? (
                      <div className="rounded-lg border border-dashed border-border bg-background p-3 sm:col-span-2">
                        <dt className="text-xs font-medium text-muted-foreground">{t("dashboard.admin.notes")}</dt>
                        <dd className="mt-1 break-words text-foreground">{o.notes}</dd>
                      </div>
                    ) : null}
                  </dl>
                  <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 sm:hidden">
                    <Link href={detailsHref} className={detailsBtnClass}>
                      {t("dashboard.admin.viewDetails")}
                    </Link>
                    <AdminShipmentDeleteButton requestId={o.id} />
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
