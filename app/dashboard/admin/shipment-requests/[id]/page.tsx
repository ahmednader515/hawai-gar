import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapboxLocationPreview } from "@/components/mapbox-location-preview";
import { ShipmentRequestAdminActions } from "../shipment-request-admin-actions";
import { CopyableRequestId } from "@/components/copyable-request-id";
import { SarPriceDisplay } from "@/components/sar-price-display";
import { formatDashboardDateTime } from "@/lib/format-datetime";
import { getLocale, getTranslations } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";
import { Building2, Calendar, ChevronLeft, MapPin, Package, Phone, Truck } from "lucide-react";
import { ShipmentRequestProgressBar } from "@/components/shipment-request-progress-bar";

function statusBadgeClass(status: string): string {
  switch (status) {
    case "PENDING_CARRIER":
      return "bg-amber-100 text-amber-950 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-100 dark:ring-amber-800/50";
    case "CARRIER_ACCEPTED":
      return "bg-sky-100 text-sky-950 ring-sky-200/80 dark:bg-sky-950/40 dark:text-sky-100 dark:ring-sky-800/50";
    case "CARRIER_REFUSED":
      return "bg-orange-100 text-orange-950 ring-orange-200/80 dark:bg-orange-950/40 dark:text-orange-100 dark:ring-orange-800/50";
    case "ADMIN_APPROVED":
      return "bg-emerald-100 text-emerald-950 ring-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-100 dark:ring-emerald-800/50";
    case "AWAITING_PAYMENT_APPROVAL":
      return "bg-amber-100 text-amber-950 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-100 dark:ring-amber-800/50";
    case "ADMIN_REJECTED":
      return "bg-red-100 text-red-950 ring-red-200/80 dark:bg-red-950/40 dark:text-red-100 dark:ring-red-800/50";
    case "COMPLETE":
      return "bg-green-100 text-green-950 ring-green-200/80 dark:bg-green-950/40 dark:text-green-100 dark:ring-green-800/50";
    default:
      return "bg-muted text-muted-foreground ring-border";
  }
}

function DetailField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/70 bg-muted/25 px-3 py-2.5 transition-colors hover:bg-muted/40",
        className,
      )}
    >
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold text-foreground leading-snug">{children}</div>
    </div>
  );
}

export default async function AdminShipmentRequestDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const t = await getTranslations();
  const locale = await getLocale();
  const dateLocaleKey = locale === "ar" ? "ar" : "en";

  const { id } = await params;
  const r = await prisma.shipmentRequest.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      createdAt: true,
      carrierDecisionAt: true,

      companyId: true,
      carrierId: true,

      fromText: true,
      toText: true,
      shipmentType: true,

      fromLat: true,
      fromLng: true,
      toLat: true,
      toLng: true,

      distanceKm: true,
      priceSar: true,

      containerSize: true,
      containersCount: true,
      pickupDate: true,
      notes: true,
      phone: true,
      estimatedPriceSar: true,
      invoiceLink: true,
      invoiceImageUrl: true,
    },
  });

  if (!r) redirect("/dashboard/admin");

  const [companyUser, carrierUser] = await Promise.all([
    r.companyId
      ? prisma.user.findUnique({
          where: { id: r.companyId },
          select: {
            email: true,
            companyProfile: {
              select: {
                companyName: true,
                contactPerson: true,
                phone: true,
                address: true,
                city: true,
              },
            },
          },
        })
      : Promise.resolve(null),
    r.carrierId
      ? prisma.user.findUnique({
          where: { id: r.carrierId },
          select: {
            email: true,
            driverProfile: {
              select: {
                fullName: true,
                phone: true,
                carPlate: true,
                carType: true,
                licenseNumber: true,
              },
            },
          },
        })
      : Promise.resolve(null),
  ]);

  const hasCoords =
    r.fromLat != null && r.fromLng != null && r.toLat != null && r.toLng != null;

  const statusKey = `shipmentRequestStatus.${r.status}`;
  const statusLabelT = t(statusKey);
  const statusLabel = statusLabelT !== statusKey ? statusLabelT : r.status;

  const da = "dashboard.admin";

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-2">
          <Link
            href="/dashboard/admin"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden />
            {t(`${da}.shipmentDetailBack`)}
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t(`${da}.shipmentDetailTitle`)}
          </h1>
        </div>
        <span
          className={cn(
            "inline-flex w-fit max-w-full shrink-0 items-center rounded-full px-4 py-1.5 text-center text-xs font-semibold leading-tight ring-1 ring-inset sm:text-sm",
            statusBadgeClass(r.status),
          )}
        >
          {statusLabel}
        </span>
      </div>

      <ShipmentRequestProgressBar status={r.status} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,300px),1fr] lg:items-start">
        <aside className="space-y-4 lg:sticky lg:top-4">
          <CopyableRequestId id={r.id} compact className="max-w-full" />
          <Card size="sm" className="shadow-sm">
            <CardHeader className="border-b border-border/60 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Calendar className="size-4 text-muted-foreground" aria-hidden />
                {t(`${da}.shipmentDetailDatesTitle`)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-1 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">{t(`${da}.shipmentDetailCreatedAt`)}</div>
                <div className="font-medium tabular-nums">
                  {formatDashboardDateTime(r.createdAt, dateLocaleKey)}
                </div>
              </div>
              {r.carrierDecisionAt && (
                <div>
                  <div className="text-xs text-muted-foreground">
                    {t(`${da}.shipmentDetailCarrierDecisionAt`)}
                  </div>
                  <div className="font-medium tabular-nums">
                    {formatDashboardDateTime(r.carrierDecisionAt, dateLocaleKey)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>

        <div className="min-w-0 space-y-6">
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/[0.06] via-card to-card shadow-sm ring-1 ring-primary/10">
            <CardHeader className="pb-2">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0 space-y-1">
                  <CardDescription className="text-xs font-medium uppercase tracking-wide text-primary/80">
                    {t(`${da}.shipmentDetailRouteSection`)}
                  </CardDescription>
                  <CardTitle className="text-base leading-relaxed sm:text-lg">
                    <span className="text-muted-foreground">{t(`${da}.shipmentDetailFromPrefix`)}</span>
                    <span className="font-semibold text-foreground">{r.fromText}</span>
                    <span className="text-muted-foreground">{t(`${da}.shipmentDetailToPrefix`)}</span>
                    <span className="font-semibold text-foreground">{r.toText}</span>
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="border-b border-border/60 pb-3">
              <CardTitle className="flex items-center gap-2">
                <Package className="size-5 text-primary" aria-hidden />
                {t(`${da}.shipmentDetailDetailsTitle`)}
              </CardTitle>
              <CardDescription>{t(`${da}.shipmentDetailDetailsSubtitle`)}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailField label={t(`${da}.shipmentType`)}>{r.shipmentType ?? "—"}</DetailField>
                <DetailField label={t(`${da}.containerCount`)}>
                  {(r.containerSize ?? "—") + " — " + (r.containersCount ?? "—")}
                </DetailField>
                <DetailField label={t(`${da}.pickupDate`)}>{r.pickupDate ?? "—"}</DetailField>
                <DetailField label={t(`${da}.shipmentDetailFieldPhone`)}>
                  {r.phone ? (
                    <span dir="ltr" className="inline-block font-mono">
                      {r.phone}
                    </span>
                  ) : (
                    "—"
                  )}
                </DetailField>
                <DetailField label={t(`${da}.shipmentDetailFieldDistance`)}>
                  {typeof r.distanceKm === "number"
                    ? t(`${da}.shipmentDetailDistanceKm`).replace("{n}", r.distanceKm.toFixed(1))
                    : "—"}
                </DetailField>
                <DetailField label={t(`${da}.shipmentDetailFieldPrice`)}>
                  {typeof r.priceSar === "number" ? (
                    <SarPriceDisplay
                      amount={r.priceSar}
                      locale={locale}
                      amountClassName="text-base font-bold tabular-nums text-foreground"
                    />
                  ) : (
                    "—"
                  )}
                </DetailField>
              </div>

              {r.notes && (
                <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-3">
                  <div className="text-xs font-medium text-muted-foreground">
                    {t(`${da}.shipmentDetailNotes`)}
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {r.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {hasCoords && (
            <Card className="overflow-hidden shadow-sm">
              <CardHeader className="border-b border-border/60 pb-3">
                <CardTitle className="text-base">{t(`${da}.shipmentDetailMapTitle`)}</CardTitle>
                <CardDescription>{t(`${da}.shipmentDetailMapLegend`)}</CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-0 pt-0">
                <MapboxLocationPreview
                  from={{ lat: r.fromLat as number, lng: r.fromLng as number }}
                  to={{ lat: r.toLat as number, lng: r.toLng as number }}
                  heightClassName="h-72 sm:h-80"
                  interactive
                />
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="inline-block size-3 rounded-sm bg-[#1b8254]" aria-hidden />
                    {t("hero.mapFrom")}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block size-3 rounded-sm bg-[#f59e0b]" aria-hidden />
                    {t("hero.mapTo")}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader className="border-b border-border/60 pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="size-5 text-primary" aria-hidden />
                  {t(`${da}.company`)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-3 text-sm">
                {companyUser?.companyProfile ? (
                  <>
                    <p className="font-semibold text-foreground">
                      {companyUser.companyProfile.companyName}
                    </p>
                    <p className="text-muted-foreground">
                      {t(`${da}.shipmentDetailCompanyContact`)}: {companyUser.companyProfile.contactPerson}
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="size-3.5 shrink-0 opacity-70" aria-hidden />
                      {companyUser.companyProfile.phone}
                    </p>
                    {companyUser.companyProfile.address && (
                      <p className="text-muted-foreground">{companyUser.companyProfile.address}</p>
                    )}
                    {companyUser.companyProfile.city && (
                      <p className="text-muted-foreground">
                        {t(`${da}.shipmentDetailCompanyCity`)}: {companyUser.companyProfile.city}
                      </p>
                    )}
                    {companyUser.email && (
                      <p className="break-all text-muted-foreground">
                        {t(`${da}.shipmentDetailCompanyEmail`)}: {companyUser.email}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">—</p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="border-b border-border/60 pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Truck className="size-5 text-primary" aria-hidden />
                  {t(`${da}.carrier`)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-3 text-sm">
                {carrierUser?.driverProfile ? (
                  <>
                    <p className="font-semibold text-foreground">{carrierUser.driverProfile.fullName}</p>
                    <p className="text-muted-foreground">
                      {t(`${da}.shipmentDetailCarrierPhone`)}: {carrierUser.driverProfile.phone}
                    </p>
                    <p className="text-muted-foreground">
                      {t(`${da}.shipmentDetailCarrierPlate`)}: {carrierUser.driverProfile.carPlate}
                    </p>
                    {carrierUser.driverProfile.carType && (
                      <p className="text-muted-foreground">
                        {t(`${da}.shipmentDetailCarrierVehicleType`)}: {carrierUser.driverProfile.carType}
                      </p>
                    )}
                    {carrierUser.driverProfile.licenseNumber && (
                      <p className="text-muted-foreground">
                        {t(`${da}.shipmentDetailCarrierLicense`)}: {carrierUser.driverProfile.licenseNumber}
                      </p>
                    )}
                    {carrierUser.email && (
                      <p className="break-all text-muted-foreground">
                        {t(`${da}.shipmentDetailCarrierEmail`)}: {carrierUser.email}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">—</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-primary/20 shadow-sm ring-1 ring-primary/10">
            <CardHeader className="border-b border-border/60 pb-3">
              <CardTitle className="text-base">{t(`${da}.shipmentDetailAdminActionsTitle`)}</CardTitle>
              <CardDescription>{t(`${da}.shipmentDetailAdminActionsSubtitle`)}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ShipmentRequestAdminActions
                id={r.id}
                status={r.status}
                priceSar={r.priceSar ?? null}
                estimatedPriceSar={r.estimatedPriceSar ?? null}
                invoiceLink={r.invoiceLink ?? null}
                invoiceImageUrl={r.invoiceImageUrl ?? null}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
