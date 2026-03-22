"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapboxLocationPreview } from "@/components/mapbox-location-preview";
import { DashboardListSearch } from "@/components/dashboard-list-search";
import { ShipmentRequestActions } from "./shipment-request-actions";
import { AR_LOCALE_LATN } from "@/lib/locale";
import { CopyableRequestId } from "@/components/copyable-request-id";
import { SarPriceDisplay } from "@/components/sar-price-display";
import { ShipmentPriceChangeAlert } from "@/components/shipment-price-change-alert";
import type { AppLocale } from "@/lib/i18n/config";
import { sarAmountInWords } from "@/lib/format-sar";
import { useI18n } from "@/components/providers/i18n-provider";

export type SerializedShipmentRequest = {
  id: string;
  status: string;
  createdAt: string;
  fromText: string;
  toText: string;
  containerSize: string | null;
  containersCount: string | null;
  distanceKm: number | null;
  priceSar: number | null;
  estimatedPriceSar: number | null;
  adminPriceChanged: boolean;
  shipmentType: string | null;
  pickupDate: string | null;
  notes: string | null;
  fromLat: number | null;
  fromLng: number | null;
  toLat: number | null;
  toLng: number | null;
};

export type SerializedLegacyOrder = {
  id: string;
  bookingNumber: string | null;
  createdAt: string;
  fromName: string;
  toName: string;
  companyName: string | null;
};

export type IncomingStatusFilter = "all" | "PENDING_CARRIER" | "AWAITING_ADMIN";

function shipmentMatchesIncomingFilter(
  r: SerializedShipmentRequest,
  filter: IncomingStatusFilter,
): boolean {
  if (filter === "all") return true;
  if (filter === "PENDING_CARRIER") return r.status === "PENDING_CARRIER";
  if (filter === "AWAITING_ADMIN") {
    return r.status === "CARRIER_ACCEPTED" || r.status === "CARRIER_REFUSED";
  }
  return true;
}

function shipmentStatusLabel(status: string, t: (k: string) => string) {
  const key = `shipmentRequestStatus.${status}`;
  const msg = t(key);
  return msg !== key ? msg : status;
}

function shipmentMatches(
  q: string,
  r: SerializedShipmentRequest,
  t: (k: string) => string,
  locale: AppLocale,
) {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  const statusLabel = shipmentStatusLabel(r.status, t);
  const hay = [
    r.id,
    r.fromText,
    r.toText,
    r.shipmentType,
    r.containerSize,
    r.containersCount,
    r.pickupDate,
    r.notes,
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

function legacyMatches(q: string, o: SerializedLegacyOrder, dateLocale: string) {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  const hay = [
    o.id,
    o.bookingNumber,
    o.fromName,
    o.toName,
    o.companyName,
    new Date(o.createdAt).toLocaleDateString(dateLocale),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(s);
}

export function ClientRequestsPageContent({
  priceChangedApprovedCount,
  shipments,
  legacyOrders,
}: {
  priceChangedApprovedCount: number;
  shipments: SerializedShipmentRequest[];
  legacyOrders: SerializedLegacyOrder[];
}) {
  const { t, locale } = useI18n();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<IncomingStatusFilter>("all");
  const dateLocale = locale === "ar" ? AR_LOCALE_LATN : "en-GB";

  const filteredShipments = useMemo(
    () =>
      shipments.filter((r) => {
        if (!shipmentMatchesIncomingFilter(r, statusFilter)) return false;
        return shipmentMatches(q, r, t, locale);
      }),
    [shipments, q, t, locale, statusFilter],
  );
  const filteredLegacy = useMemo(
    () => legacyOrders.filter((o) => legacyMatches(q, o, dateLocale)),
    [legacyOrders, q, dateLocale],
  );

  const hasAny = shipments.length > 0 || legacyOrders.length > 0;
  const noResults =
    q.trim().length > 0 &&
    hasAny &&
    filteredShipments.length === 0 &&
    filteredLegacy.length === 0;

  return (
    <div className="w-full min-w-0 max-w-full">
      {priceChangedApprovedCount > 0 && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 p-4 text-sm">
          <div className="font-semibold">{t("dashboard.client.priceAlertTitle")}</div>
          <div className="mt-1 opacity-90">
            {priceChangedApprovedCount === 1
              ? t("dashboard.client.priceAlertOne")
              : t("dashboard.client.priceAlertMany").replace("{count}", String(priceChangedApprovedCount))}
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-2">{t("dashboard.client.incomingTitle")}</h1>
      <p className="text-muted-foreground mb-6 text-sm md:text-base">
        {t("dashboard.client.incomingSubtitle")}
      </p>

      {hasAny ? (
        <div className="mb-6 flex flex-col gap-3">
          <DashboardListSearch
            value={q}
            onChange={setQ}
            placeholder={t("dashboard.client.searchRequestsPlaceholder")}
            id="client-requests-search"
          />
          {shipments.length > 0 ? (
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
                  className="h-auto min-h-8 max-w-full justify-center px-3 py-2 text-start leading-snug whitespace-normal sm:max-w-[min(100%,20rem)]"
                  onClick={() => setStatusFilter("all")}
                >
                  {t("dashboard.client.filterStatusAll")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={statusFilter === "PENDING_CARRIER" ? "default" : "outline"}
                  aria-pressed={statusFilter === "PENDING_CARRIER"}
                  className="h-auto min-h-8 max-w-full justify-center px-3 py-2 text-start leading-snug whitespace-normal sm:max-w-[min(100%,20rem)]"
                  onClick={() => setStatusFilter("PENDING_CARRIER")}
                >
                  {shipmentStatusLabel("PENDING_CARRIER", t)}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={statusFilter === "AWAITING_ADMIN" ? "default" : "outline"}
                  aria-pressed={statusFilter === "AWAITING_ADMIN"}
                  className="h-auto min-h-8 max-w-full justify-center px-3 py-2 text-start leading-snug whitespace-normal sm:max-w-[min(100%,20rem)]"
                  onClick={() => setStatusFilter("AWAITING_ADMIN")}
                >
                  {shipmentStatusLabel("AWAITING_ADMIN", t)}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {noResults ? (
        <p className="text-muted-foreground mb-8 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
          {t("dashboard.client.noSearchResults")}
        </p>
      ) : null}

      <div className="mb-8">
        <h2 className="text-lg font-bold mb-3">{t("dashboard.client.sectionShipmentsNew")}</h2>
        {shipments.length === 0 ? (
          <p className="text-muted-foreground">{t("dashboard.client.noShipments")}</p>
        ) : noResults ? null : filteredShipments.length === 0 &&
          (q.trim() || statusFilter !== "all") ? (
          <p className="text-muted-foreground">{t("dashboard.client.noShipmentsInSection")}</p>
        ) : (
          <div className="space-y-4 w-full min-w-0">
            {filteredShipments.map((r) => {
              const detailsHref = `/dashboard/client/shipment-requests/${r.id}`;
              const detailsBtnClass =
                "inline-flex w-full min-h-[48px] items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90";
              return (
              <Card key={r.id} className="min-w-0 overflow-hidden border border-border shadow-sm max-md:rounded-2xl">
                <CardHeader className="space-y-3 pb-3 max-md:px-3 max-md:pt-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-2 w-full">
                      <p className="text-xs font-medium text-muted-foreground">{t("dashboard.admin.routeHeading")}</p>
                      <p className="text-base font-semibold leading-snug break-words">
                        {t("dashboard.admin.routeFromTo").replace("{from}", r.fromText).replace("{to}", r.toText)}
                      </p>
                      <CopyableRequestId id={r.id} compact />
                    </div>
                    <div className="hidden sm:flex flex-col gap-2 items-end shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleString(dateLocale)}
                      </span>
                      <Link href={detailsHref} className={`${detailsBtnClass} sm:w-auto`}>
                        {t("dashboard.admin.viewDetails")}
                      </Link>
                    </div>
                    <div className="sm:hidden text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString(dateLocale)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 max-md:px-3 max-md:pb-3">
                  <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">{t("dashboard.client.statusPrefix")}: </span>
                    <span className="font-medium">{shipmentStatusLabel(r.status, t)}</span>
                  </div>

                  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                    <div className="rounded-lg bg-muted/40 p-3">
                      <dt className="text-xs font-medium text-muted-foreground">{t("dashboard.admin.containerCount")}</dt>
                      <dd className="mt-1 font-medium">
                        {r.containerSize ?? "—"} — {r.containersCount ?? "—"}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3">
                      <dt className="text-xs font-medium text-muted-foreground">{t("hero.distance")}</dt>
                      <dd className="mt-1 font-medium">
                        {typeof r.distanceKm === "number"
                          ? t("dashboard.admin.distanceKmShort").replace("{n}", r.distanceKm.toFixed(1))
                          : "—"}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3 sm:col-span-2">
                      <dt className="text-xs font-medium text-muted-foreground">
                        {["ADMIN_APPROVED", "AWAITING_PAYMENT_APPROVAL", "COMPLETE"].includes(r.status)
                          ? t("hero.priceFinal")
                          : t("hero.price")}
                      </dt>
                      <dd className="mt-1">
                        {typeof r.priceSar === "number" ? (
                          <SarPriceDisplay amount={r.priceSar} locale={locale} />
                        ) : (
                          "—"
                        )}
                      </dd>
                    </div>
                    {["ADMIN_APPROVED", "AWAITING_PAYMENT_APPROVAL", "COMPLETE"].includes(r.status) &&
                      r.adminPriceChanged &&
                      typeof r.estimatedPriceSar === "number" &&
                      typeof r.priceSar === "number" && (
                        <div className="sm:col-span-2">
                          <ShipmentPriceChangeAlert
                            estimatedPriceSar={r.estimatedPriceSar}
                            priceSar={r.priceSar}
                            locale={locale}
                            compact
                          />
                        </div>
                      )}
                    <div className="rounded-lg bg-muted/40 p-3">
                      <dt className="text-xs font-medium text-muted-foreground">{t("dashboard.admin.shipmentType")}</dt>
                      <dd className="mt-1 font-medium">{r.shipmentType ?? "—"}</dd>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3">
                      <dt className="text-xs font-medium text-muted-foreground">{t("dashboard.admin.pickupDate")}</dt>
                      <dd className="mt-1 font-medium">{r.pickupDate ?? "—"}</dd>
                    </div>
                    {r.notes ? (
                      <div className="rounded-lg border border-dashed border-border p-3 sm:col-span-2">
                        <dt className="text-xs font-medium text-muted-foreground">{t("dashboard.admin.notes")}</dt>
                        <dd className="mt-1 break-words">{r.notes}</dd>
                      </div>
                    ) : null}
                  </dl>

                  {r.fromLat != null && r.fromLng != null && r.toLat != null && r.toLng != null && (
                    <div className="mt-2">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">{t("dashboard.client.mapLegend")}</p>
                      <MapboxLocationPreview
                        from={{ lat: r.fromLat, lng: r.fromLng }}
                        to={{ lat: r.toLat, lng: r.toLng }}
                        heightClassName="h-36 sm:h-40"
                      />
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-3 w-3 rounded-sm bg-[#1b8254]" aria-hidden />
                          {t("hero.mapFrom")}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-3 w-3 rounded-sm bg-[#f59e0b]" aria-hidden />
                          {t("hero.mapTo")}
                        </div>
                      </div>
                    </div>
                  )}
                  <ShipmentRequestActions id={r.id} status={r.status} />
                  <div className="border-t border-border pt-4 sm:hidden">
                    <Link href={detailsHref} className={detailsBtnClass}>
                      {t("dashboard.admin.viewDetails")}
                    </Link>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </div>

      {legacyOrders.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">{t("dashboard.client.sectionLegacy")}</h2>
          {noResults ? null : filteredLegacy.length === 0 && q.trim() ? (
            <p className="text-muted-foreground">{t("dashboard.client.noLegacyInSection")}</p>
          ) : (
            filteredLegacy.map((o) => (
              <Card key={o.id} className="min-w-0 overflow-hidden border border-border shadow-sm">
                <CardHeader className="pb-2">
                  <span className="font-semibold break-words">
                    {t("dashboard.admin.routeFromTo").replace("{from}", o.fromName).replace("{to}", o.toName)}
                  </span>
                  <p className="text-sm text-muted-foreground break-words">
                    {t("dashboard.client.legacyCompany")}: {o.companyName ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    {t("dashboard.client.legacyBooking")}: {o.bookingNumber ?? "—"}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-2">
                    {new Date(o.createdAt).toLocaleDateString(dateLocale)}
                  </p>
                  <p className="text-sm text-primary font-medium">
                    {t("dashboard.client.legacyPending")}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : null}

      {!hasAny && <p className="text-muted-foreground">{t("dashboard.client.noRequestsAtAll")}</p>}
    </div>
  );
}
