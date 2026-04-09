"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MapboxLocationPreview } from "@/components/mapbox-location-preview";
import { DashboardListSearch } from "@/components/dashboard-list-search";
import { AR_LOCALE_LATN } from "@/lib/locale";
import { CopyableRequestId } from "@/components/copyable-request-id";
import { SarPriceDisplay } from "@/components/sar-price-display";
import { ShipmentPriceChangeAlert } from "@/components/shipment-price-change-alert";
import type { AppLocale } from "@/lib/i18n/config";
import { sarAmountInWords } from "@/lib/format-sar";
import { useI18n } from "@/components/providers/i18n-provider";

function orderStatusLabel(status: string, t: (k: string) => string) {
  const key = `orderStatus.${status}`;
  const msg = t(key);
  return msg !== key ? msg : status;
}

function shipmentRequestStatusLabel(status: string, t: (k: string) => string) {
  const key = `shipmentRequestStatus.${status}`;
  const msg = t(key);
  return msg !== key ? msg : status;
}

export type SerializedApprovedShipment = {
  id: string;
  status: string;
  adminDecisionAt: string | null;
  fromText: string;
  toText: string;
  containerSize: string | null;
  containersCount: string | null;
  distanceKm: number | null;
  priceSar: number | null;
  estimatedPriceSar: number | null;
  adminPriceChanged: boolean;
  adminPriceChangeNotice: string | null;
  shipmentType: string | null;
  pickupDate: string | null;
  notes: string | null;
  fromLat: number | null;
  fromLng: number | null;
  toLat: number | null;
  toLng: number | null;
};

export type SerializedClientOrder = {
  id: string;
  bookingNumber: string | null;
  status: string;
  createdAt: string;
  fromName: string;
  toName: string;
  companyName: string | null;
};

function shipMatches(q: string, r: SerializedApprovedShipment, locale: AppLocale) {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  const hay = [
    r.id,
    r.status,
    r.fromText,
    r.toText,
    r.shipmentType,
    r.containerSize,
    r.containersCount,
    r.pickupDate,
    r.notes,
    typeof r.distanceKm === "number" ? String(r.distanceKm) : "",
    typeof r.priceSar === "number" ? String(r.priceSar) : "",
    typeof r.priceSar === "number" ? sarAmountInWords(r.priceSar, locale) : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(s);
}

function orderMatches(q: string, o: SerializedClientOrder, t: (k: string) => string, dateLocale: string) {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  const hay = [
    o.id,
    o.bookingNumber,
    o.fromName,
    o.toName,
    o.companyName,
    orderStatusLabel(o.status, t),
    o.status,
    new Date(o.createdAt).toLocaleDateString(dateLocale),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(s);
}

export function ClientOrdersPageContent({
  approvedShipments,
  orders,
}: {
  approvedShipments: SerializedApprovedShipment[];
  orders: SerializedClientOrder[];
}) {
  const { t, locale } = useI18n();
  const [q, setQ] = useState("");
  const dateLocale = locale === "ar" ? AR_LOCALE_LATN : "en-GB";

  const filteredShipments = useMemo(
    () => approvedShipments.filter((r) => shipMatches(q, r, locale)),
    [approvedShipments, q, locale],
  );
  const filteredOrders = useMemo(
    () => orders.filter((o) => orderMatches(q, o, t, dateLocale)),
    [orders, q, t, dateLocale],
  );

  const hasAny = approvedShipments.length > 0 || orders.length > 0;
  const noResults =
    q.trim().length > 0 && hasAny && filteredShipments.length === 0 && filteredOrders.length === 0;

  return (
    <div className="w-full min-w-0 max-w-full">
      <h1 className="text-2xl font-bold mb-2">{t("dashboard.client.ordersTitle")}</h1>
      <p className="text-muted-foreground mb-6 text-sm md:text-base">
        {t("dashboard.client.ordersSubtitle")}
      </p>

      {hasAny ? (
        <DashboardListSearch
          value={q}
          onChange={setQ}
          placeholder={t("dashboard.client.searchOrdersPlaceholder")}
          id="client-orders-search"
        />
      ) : null}

      {noResults ? (
        <p className="text-muted-foreground mb-8 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
          {t("dashboard.client.noSearchResults")}
        </p>
      ) : null}

      <div className="mb-8">
        <h2 className="text-lg font-bold mb-3">{t("dashboard.client.approvedSection")}</h2>
        {approvedShipments.length === 0 ? (
          <p className="text-muted-foreground">{t("dashboard.client.noApprovedYet")}</p>
        ) : noResults ? null : filteredShipments.length === 0 && q.trim() ? (
          <p className="text-muted-foreground">{t("dashboard.client.noApprovedInSection")}</p>
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
                        {r.adminDecisionAt ? new Date(r.adminDecisionAt).toLocaleString(dateLocale) : "—"}
                      </span>
                      <Link href={detailsHref} className={`${detailsBtnClass} sm:w-auto`}>
                        {t("dashboard.admin.viewDetails")}
                      </Link>
                    </div>
                    <div className="sm:hidden text-xs text-muted-foreground">
                      {r.adminDecisionAt ? new Date(r.adminDecisionAt).toLocaleString(dateLocale) : "—"}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 max-md:px-3 max-md:pb-3">
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
                      <dt className="text-xs font-medium text-muted-foreground">{t("hero.priceFinal")}</dt>
                      <dd className="mt-1">
                        {typeof r.priceSar === "number" ? (
                          <SarPriceDisplay amount={r.priceSar} locale={locale} />
                        ) : (
                          "—"
                        )}
                      </dd>
                    </div>
                    {r.adminPriceChanged &&
                      typeof r.estimatedPriceSar === "number" &&
                      typeof r.priceSar === "number" && (
                        <div className="sm:col-span-2">
                          <ShipmentPriceChangeAlert
                            estimatedPriceSar={r.estimatedPriceSar}
                            priceSar={r.priceSar}
                            locale={locale}
                            compact
                            adminNotice={r.adminPriceChangeNotice}
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
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground pt-1 rounded-lg bg-muted/30 px-3 py-2">
                    {t("dashboard.client.statusPrefix")}: {shipmentRequestStatusLabel(r.status, t)}
                  </p>
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

      {orders.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">{t("dashboard.client.ordersLegacySection")}</h2>
          {noResults ? null : filteredOrders.length === 0 && q.trim() ? (
            <p className="text-muted-foreground">{t("dashboard.client.noOrdersInSection")}</p>
          ) : (
            filteredOrders.map((o) => (
              <Card key={o.id} className="min-w-0 overflow-hidden border border-border shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-start">
                    <span className="font-semibold min-w-0 break-words">
                      {t("dashboard.admin.routeFromTo").replace("{from}", o.fromName).replace("{to}", o.toName)}
                    </span>
                    <span className="text-sm text-muted-foreground shrink-0">
                      {orderStatusLabel(o.status, t)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    {t("dashboard.client.legacyBooking")}: {o.bookingNumber ?? "—"}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground break-words">
                    {t("dashboard.client.legacyCompany")}: {o.companyName ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(o.createdAt).toLocaleDateString(dateLocale)}
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
