import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, MapPinned, Package, Route, StickyNote } from "lucide-react";
import { getLocale, getTranslations } from "@/lib/i18n/server";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { CopyableRequestId } from "@/components/copyable-request-id";
import { MapboxLocationPreview } from "@/components/mapbox-location-preview";
import { SarPriceDisplay } from "@/components/sar-price-display";
import { ShipmentPriceChangeAlert } from "@/components/shipment-price-change-alert";
import { ShipmentRequestActions } from "../../requests/shipment-request-actions";
import { toLatinDigits } from "@/lib/to-latin-digits";
import { cn } from "@/lib/utils";
import { ShipmentRequestProgressBar } from "@/components/shipment-request-progress-bar";

function statusBadgeClass(status: string) {
  switch (status) {
    case "ADMIN_APPROVED":
      return "border-emerald-200 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100";
    case "AWAITING_PAYMENT_APPROVAL":
      return "border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100";
    case "ADMIN_REJECTED":
      return "border-red-200 bg-red-100 text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-100";
    case "PENDING_CARRIER":
      return "border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100";
    case "CARRIER_ACCEPTED":
      return "border-sky-200 bg-sky-100 text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100";
    case "CARRIER_REFUSED":
      return "border-orange-200 bg-orange-100 text-orange-900 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-100";
    case "COMPLETE":
      return "border-green-200 bg-green-100 text-green-900 dark:border-green-800 dark:bg-green-950/40 dark:text-green-100";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function shipmentStatusLabel(status: string, t: (key: string) => string) {
  const key = `shipmentRequestStatus.${status}`;
  const msg = t(key);
  return msg !== key ? msg : status;
}

export default async function ClientShipmentRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations();
  const locale = await getLocale();
  const dateLocale = locale === "ar" ? "ar-SA" : "en-GB";

  const r = await prisma.shipmentRequest.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      createdAt: true,
      fromText: true,
      toText: true,
      shipmentType: true,
      fromLat: true,
      fromLng: true,
      toLat: true,
      toLng: true,
      distanceKm: true,
      priceSar: true,
      estimatedPriceSar: true,
      adminPriceChanged: true,
      adminPriceChangeNotice: true,
      containerSize: true,
      containersCount: true,
      pickupDate: true,
      notes: true,
        shipmentCompany: {
          select: {
            company_name: true,
            representative_name: true,
            phone: true,
            email: true,
          },
        },
    },
  });

  if (!r) notFound();

  const routeLine = toLatinDigits(
    t("dashboard.admin.routeFromTo").replace("{from}", r.fromText).replace("{to}", r.toText),
  );

  const createdAt = toLatinDigits(
    r.createdAt.toLocaleString(dateLocale, {
      dateStyle: "short",
      timeStyle: "medium",
    }),
  );

  const statusText = shipmentStatusLabel(r.status, t);

  const distanceStr =
    typeof r.distanceKm === "number" && Number.isFinite(r.distanceKm)
      ? toLatinDigits(t("dashboard.admin.distanceKmShort").replace("{n}", r.distanceKm.toFixed(1)))
      : "—";

  const hasCoords =
    r.fromLat != null && r.fromLng != null && r.toLat != null && r.toLng != null;

  const showAdminPriceChange =
    ["ADMIN_APPROVED", "AWAITING_PAYMENT_APPROVAL", "COMPLETE"].includes(r.status) &&
    r.adminPriceChanged &&
    typeof r.estimatedPriceSar === "number" &&
    typeof r.priceSar === "number";

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 pb-12">
      <Link
        href="/dashboard/client/requests"
        className="group inline-flex items-center gap-2 rounded-xl border border-transparent px-1 py-1 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:bg-muted/60 hover:text-foreground"
      >
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-muted/80 text-foreground transition-colors group-hover:bg-muted">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
        </span>
        {t("dashboard.client.backToIncoming")}
      </Link>

      <header className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("dashboard.client.detailTitle")}
            </h1>
            <p className="flex items-start gap-2 text-base font-medium leading-relaxed text-foreground/90">
              <Route className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <span className="break-words">{routeLine}</span>
            </p>
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center self-start rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-sm",
              statusBadgeClass(r.status),
            )}
          >
            {statusText}
          </span>
        </div>
        <ShipmentRequestProgressBar status={r.status} />
        <time
          className="block text-xs text-muted-foreground tabular-nums"
          dateTime={r.createdAt.toISOString()}
        >
          {createdAt}
        </time>
      </header>

      <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm ring-1 ring-border/60">
        <CardContent className="p-0">
          <div className="border-b bg-gradient-to-l from-primary/[0.08] to-transparent px-4 py-4 sm:px-6 sm:py-5 dark:from-primary/10">
            <CopyableRequestId id={r.id} compact />
          </div>

          <div className="space-y-8 p-4 sm:p-6">
            <section aria-labelledby="shipment-details-heading">
              <h2 id="shipment-details-heading" className="sr-only">
                {t("dashboard.client.detailTitle")}
              </h2>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <Package className="h-3.5 w-3.5" aria-hidden />
                    {t("dashboard.admin.containerCount")}
                  </dt>
                  <dd className="mt-2 text-sm font-semibold tabular-nums text-foreground">
                    {toLatinDigits(`${r.containerSize ?? "—"} — ${r.containersCount ?? "—"}`)}
                  </dd>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("dashboard.admin.shipmentType")}
                  </dt>
                  <dd className="mt-2 text-sm font-semibold text-foreground">
                    {r.shipmentType ? toLatinDigits(r.shipmentType) : "—"}
                  </dd>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("hero.distance")}
                  </dt>
                  <dd className="mt-2 text-sm font-semibold tabular-nums text-foreground">{distanceStr}</dd>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" aria-hidden />
                    {t("dashboard.admin.pickupDate")}
                  </dt>
                  <dd className="mt-2 text-sm font-semibold tabular-nums text-foreground">
                    {r.pickupDate ? toLatinDigits(r.pickupDate) : "—"}
                  </dd>
                </div>
              </dl>
            </section>

            {r.shipmentCompany && (
              <section
                className="rounded-xl border border-border/60 bg-muted/25 p-4"
                aria-labelledby="assigned-carrier-heading"
              >
                <h2
                  id="assigned-carrier-heading"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {t("dashboard.admin.carrier")}
                </h2>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {r.shipmentCompany.company_name ?? "—"}
                </p>
                {r.shipmentCompany.representative_name ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.shipmentCompany.representative_name}
                  </p>
                ) : null}
                {r.shipmentCompany.phone ? (
                  <p className="mt-1 text-xs text-muted-foreground">{r.shipmentCompany.phone}</p>
                ) : null}
                {r.shipmentCompany.email ? (
                  <p className="mt-1 text-xs text-muted-foreground break-all">
                    {r.shipmentCompany.email}
                  </p>
                ) : null}
              </section>
            )}

            <section
              className="rounded-2xl border border-primary/20 bg-primary/[0.06] p-5 dark:bg-primary/10"
              aria-labelledby="price-heading"
            >
              <h2
                id="price-heading"
                className="text-xs font-semibold uppercase tracking-wide text-primary"
              >
                {["ADMIN_APPROVED", "AWAITING_PAYMENT_APPROVAL", "COMPLETE"].includes(r.status)
                  ? t("hero.priceFinal")
                  : t("hero.price")}
              </h2>
              <div className="mt-3">
                {typeof r.priceSar === "number" ? (
                  <SarPriceDisplay
                    amount={r.priceSar}
                    locale={locale}
                    className="space-y-1"
                    amountClassName="text-3xl font-bold tracking-tight text-primary tabular-nums sm:text-4xl"
                    wordsClassName="mt-2 text-sm font-medium leading-relaxed text-muted-foreground sm:text-base"
                  />
                ) : (
                  <p className="text-lg font-medium text-muted-foreground">—</p>
                )}
              </div>
              {showAdminPriceChange && (
                <div className="mt-4">
                  <ShipmentPriceChangeAlert
                    estimatedPriceSar={r.estimatedPriceSar!}
                    priceSar={r.priceSar!}
                    locale={locale}
                    adminNotice={r.adminPriceChangeNotice}
                  />
                </div>
              )}
            </section>

            {r.notes?.trim() && (
              <section
                className="rounded-xl border border-dashed border-border bg-muted/20 p-4"
                aria-labelledby="notes-heading"
              >
                <h2
                  id="notes-heading"
                  className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  <StickyNote className="h-3.5 w-3.5" aria-hidden />
                  {t("dashboard.admin.notes")}
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{r.notes}</p>
              </section>
            )}

            {hasCoords && (
              <section className="space-y-3" aria-labelledby="map-heading">
                <h2
                  id="map-heading"
                  className="flex items-center gap-2 text-sm font-semibold text-foreground"
                >
                  <MapPinned className="h-4 w-4 text-primary" aria-hidden />
                  {t("dashboard.client.mapLegend")}
                </h2>
                <div className="overflow-hidden rounded-2xl border border-border/80 bg-muted/40 shadow-inner ring-1 ring-black/5 dark:ring-white/10">
                  <MapboxLocationPreview
                    from={{ lat: r.fromLat as number, lng: r.fromLng as number }}
                    to={{ lat: r.toLat as number, lng: r.toLng as number }}
                    heightClassName="h-[min(420px,55vh)] min-h-[240px] w-full sm:h-[min(440px,50vh)]"
                    interactive
                  />
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-sm bg-[#1b8254]" aria-hidden />
                    {t("hero.from").replace(":", "").trim()}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-sm bg-[#f59e0b]" aria-hidden />
                    {t("hero.to").replace(":", "").trim()}
                  </span>
                </div>
              </section>
            )}

            <div className="border-t border-border pt-6">
              <ShipmentRequestActions id={r.id} status={r.status} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
