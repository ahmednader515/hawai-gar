import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getLocale, getTranslations } from "@/lib/i18n/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SarPriceDisplay } from "@/components/sar-price-display";
import { computeShipmentEstimateSar, getShipmentPricingSettings } from "@/lib/shipment-pricing";
import { formatDashboardDateTime } from "@/lib/format-datetime";
import { AnalyticsFilters } from "./analytics-filters";

const DAY_OPTIONS = [7, 30, 90, 365] as const;
const MAX_ROWS_FOR_PROFIT = 5000;
const KEY_ANALYTICS_BASELINE = "analytics_baseline_ts";

function parseDays(raw: string | undefined): number | null {
  if (!raw || raw === "all") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 30;
  // allow only known options
  if ((DAY_OPTIONS as readonly number[]).includes(n)) return n;
  return 30;
}

function parseMonth(raw: string | undefined): { start: Date; end: Date; label: string } | null {
  if (!raw) return null;
  const m = String(raw).trim();
  const match = /^(\d{4})-(\d{2})$/.exec(m);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end, label: m };
}

function parseWeek(raw: string | undefined): { start: Date; end: Date; label: string } | null {
  if (!raw) return null;
  const w = String(raw).trim();
  const match = /^(\d{4})-W(\d{2})$/.exec(w);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(week) || week < 1 || week > 53) return null;

  // ISO week: Monday of week 1 is the Monday of the week with Jan 4th.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = (jan4.getUTCDay() + 6) % 7; // Monday=0..Sunday=6
  const week1Mon = new Date(Date.UTC(year, 0, 4 - jan4Day));
  const start = new Date(week1Mon.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { start, end, label: w };
}

function sum(nums: Array<number | null | undefined>): number {
  return nums.reduce<number>(
    (acc, n) => acc + (typeof n === "number" && Number.isFinite(n) ? n : 0),
    0,
  );
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; month?: string; week?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const t = await getTranslations();
  const locale = await getLocale();
  const dateLocaleKey = locale === "ar" ? "ar" : "en";
  const da = "dashboard.admin";

  const sp = await searchParams;
  const monthRange = parseMonth(sp?.month);
  const weekRange = parseWeek(sp?.week);
  const days = monthRange || weekRange ? null : parseDays(sp?.days);
  const fromDays = days != null ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : null;

  const baselineRow = await prisma.siteSetting.findUnique({ where: { key: KEY_ANALYTICS_BASELINE } });
  const baseline =
    baselineRow?.value && String(baselineRow.value).trim() ? new Date(String(baselineRow.value)) : null;
  const baselineDate = baseline && Number.isFinite(baseline.getTime()) ? baseline : null;

  const rangeStart = monthRange?.start ?? weekRange?.start ?? fromDays ?? null;
  const rangeEnd = monthRange?.end ?? weekRange?.end ?? null; // exclusive

  const effectiveStart =
    rangeStart && baselineDate ? (rangeStart > baselineDate ? rangeStart : baselineDate) : rangeStart ?? baselineDate;

  const where: any = {};
  if (effectiveStart && rangeEnd) {
    where.createdAt = { gte: effectiveStart, lt: rangeEnd };
  } else if (effectiveStart) {
    where.createdAt = { gte: effectiveStart };
  } else if (rangeEnd) {
    where.createdAt = { lt: rangeEnd };
  }

  const [totalCount, statusGroups, pricing] = await Promise.all([
    prisma.shipmentRequest.count({ where }),
    prisma.shipmentRequest.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
      _sum: { priceSar: true },
      orderBy: { status: "asc" },
    }),
    getShipmentPricingSettings(),
  ]);

  // For profit, compute request price (without company margin) per row using current pricing settings.
  // This is the only reliable way without persisting historic pricing snapshots.
  const rowsForProfit = await prisma.shipmentRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: Math.min(totalCount, MAX_ROWS_FOR_PROFIT),
    select: {
      id: true,
      status: true,
      createdAt: true,
      fromText: true,
      toText: true,
      shipmentType: true,
      containerSize: true,
      containersCount: true,
      distanceKm: true,
      priceSar: true,
      companyId: true,
    },
  });

  const companyIds = Array.from(new Set(rowsForProfit.map((r) => r.companyId).filter(Boolean))) as string[];
  const companies =
    companyIds.length === 0
      ? []
      : await prisma.user.findMany({
          where: { id: { in: companyIds } },
          select: { id: true, companyProfile: { select: { companyName: true } } },
        });
  const companyNameById = new Map(companies.map((u) => [u.id, u.companyProfile?.companyName ?? null]));

  const computed = rowsForProfit.map((r) => {
    const canCompute =
      typeof r.distanceKm === "number" && Number.isFinite(r.distanceKm) && r.distanceKm > 0;
    const requestPriceSar = canCompute
      ? computeShipmentEstimateSar(
          r.distanceKm as number,
          { ...pricing, companyProfitMarginPct: 0 },
          {
            shipmentType: r.shipmentType ? String(r.shipmentType) : null,
            truckSize: r.containerSize ? String(r.containerSize) : null,
            truckType: r.containersCount ? String(r.containersCount) : null,
          },
        )
      : null;
    const final = typeof r.priceSar === "number" && Number.isFinite(r.priceSar) ? r.priceSar : null;
    const profitSar = requestPriceSar != null && final != null ? final - requestPriceSar : null;
    return {
      ...r,
      companyName: r.companyId ? companyNameById.get(r.companyId) ?? null : null,
      requestPriceSar,
      profitSar,
    };
  });

  const revenueSar = sum(statusGroups.map((g) => g._sum.priceSar ?? 0));
  const requestTotalSar = sum(computed.map((r) => r.requestPriceSar));
  const profitTotalSar = sum(computed.map((r) => r.profitSar));

  const rangeLabel = monthRange
    ? t(`${da}.analyticsRangeMonth`).replace("{ym}", monthRange.label)
    : weekRange
      ? t(`${da}.analyticsRangeWeek`).replace("{w}", weekRange.label)
      : days == null
        ? t(`${da}.analyticsRangeAll`)
        : t(`${da}.analyticsRangeDays`).replace("{n}", String(days));

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{t(`${da}.analyticsTitle`)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t(`${da}.analyticsIntro`)}</p>
        </div>
        <AnalyticsFilters current={{ days: sp?.days, month: sp?.month, week: sp?.week }} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>{t(`${da}.analyticsRangeLabel`)}</CardDescription>
            <CardTitle className="text-base">{rangeLabel}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-muted-foreground">
            {baselineDate ? (
              <p className="mb-2">
                {t(`${da}.analyticsBaselineLabel`)}{" "}
                <span className="font-semibold tabular-nums">
                  {formatDashboardDateTime(baselineDate, dateLocaleKey)}
                </span>
              </p>
            ) : null}
            {totalCount > MAX_ROWS_FOR_PROFIT ? (
              <p>{t(`${da}.analyticsProfitSampled`).replace("{n}", String(MAX_ROWS_FOR_PROFIT))}</p>
            ) : (
              <p>{t(`${da}.analyticsProfitAccurate`)}</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>{t(`${da}.analyticsTotalRequests`)}</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">{String(totalCount)}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>{t(`${da}.analyticsRevenue`)}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <SarPriceDisplay amount={Math.round(revenueSar)} locale={locale} />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>{t(`${da}.analyticsProfit`)}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <SarPriceDisplay amount={Math.round(profitTotalSar)} locale={locale} />
            <p className="mt-2 text-xs text-muted-foreground">
              {t(`${da}.analyticsRequestTotal`).replace("{amount}", String(Math.round(requestTotalSar)))}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="border-b border-border/60 pb-3">
          <CardTitle className="text-base">{t(`${da}.analyticsByStatusTitle`)}</CardTitle>
          <CardDescription>{t(`${da}.analyticsByStatusSubtitle`)}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-right p-3 font-medium">{t(`${da}.analyticsColStatus`)}</th>
                  <th className="text-right p-3 font-medium">{t(`${da}.analyticsColCount`)}</th>
                  <th className="text-right p-3 font-medium">{t(`${da}.analyticsColRevenue`)}</th>
                </tr>
              </thead>
              <tbody>
                {statusGroups.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-muted-foreground">
                      {t(`${da}.analyticsNoData`)}
                    </td>
                  </tr>
                ) : (
                  statusGroups.map((g) => {
                    const key = `shipmentRequestStatus.${g.status}`;
                    const statusLabel = t(key) !== key ? t(key) : g.status;
                    const cnt = g._count._all;
                    const sumSar = g._sum.priceSar ?? 0;
                    return (
                      <tr key={g.status} className="border-t">
                        <td className="p-3 font-medium">{statusLabel}</td>
                        <td className="p-3 tabular-nums">{String(cnt)}</td>
                        <td className="p-3 tabular-nums">{Math.round(sumSar).toLocaleString(locale === "ar" ? "ar" : "en")}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="border-b border-border/60 pb-3">
          <CardTitle className="text-base">{t(`${da}.analyticsLatestTitle`)}</CardTitle>
          <CardDescription>{t(`${da}.analyticsLatestSubtitle`)}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[860px]">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-right p-3 font-medium">{t(`${da}.analyticsColId`)}</th>
                  <th className="text-right p-3 font-medium">{t(`${da}.analyticsColCreatedAt`)}</th>
                  <th className="text-right p-3 font-medium">{t(`${da}.analyticsColRoute`)}</th>
                  <th className="text-right p-3 font-medium">{t(`${da}.analyticsColCompany`)}</th>
                  <th className="text-right p-3 font-medium">{t(`${da}.analyticsColFinalPrice`)}</th>
                  <th className="text-right p-3 font-medium">{t(`${da}.analyticsColRequestPrice`)}</th>
                  <th className="text-right p-3 font-medium">{t(`${da}.analyticsColProfit`)}</th>
                </tr>
              </thead>
              <tbody>
                {computed.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-muted-foreground">
                      {t(`${da}.analyticsNoData`)}
                    </td>
                  </tr>
                ) : (
                  computed.map((r) => (
                    <tr key={r.id} className="border-t align-top">
                      <td className="p-3">
                        <Link href={`/dashboard/admin/shipment-requests/${r.id}`} className="text-primary hover:underline font-medium">
                          {r.id}
                        </Link>
                      </td>
                      <td className="p-3 tabular-nums">
                        {formatDashboardDateTime(r.createdAt, dateLocaleKey)}
                      </td>
                      <td className="p-3">
                        <div className="min-w-0 max-w-[24rem] break-words">
                          {r.fromText} → {r.toText}
                        </div>
                      </td>
                      <td className="p-3">{r.companyName ?? "—"}</td>
                      <td className="p-3 tabular-nums">{r.priceSar != null ? String(Math.round(r.priceSar)) : "—"}</td>
                      <td className="p-3 tabular-nums">
                        {r.requestPriceSar != null ? String(Math.round(r.requestPriceSar)) : "—"}
                      </td>
                      <td className="p-3 tabular-nums">
                        {r.profitSar != null ? String(Math.round(r.profitSar)) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

