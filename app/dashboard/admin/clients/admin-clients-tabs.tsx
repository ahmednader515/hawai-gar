"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { CompanyUserActions, DirectoryCarrierActions, DriverUserActions } from "@/components/admin-clients-actions";
import { useI18n } from "@/components/providers/i18n-provider";
import { AR_LOCALE_LATN } from "@/lib/locale";
import {
  carrierRowCompanyName,
  carrierRowDestinations,
  carrierRowRepresentative,
  carrierRowTruckTypes,
  type CarrierRow,
  type CompanyRow,
  type ShipmentCompanyDirectoryRow,
} from "@/lib/admin-clients-types";

export type { CarrierRow, CompanyRow, ShipmentCompanyDirectoryRow } from "@/lib/admin-clients-types";

const da = "dashboard.admin";

/** Equal columns + fixed layout keeps header/body aligned in RTL (avoid dir=ltr on &lt;td&gt;). */
const COLGROUP_8 = (
  <colgroup>
    {Array.from({ length: 8 }, (_, i) => (
      <col key={i} style={{ width: `${100 / 8}%` }} />
    ))}
  </colgroup>
);

function LtrCell({ children }: { children: ReactNode }) {
  return <span dir="ltr" className="inline-block max-w-full">{children}</span>;
}

/** Stacked label + value for mobile client cards */
function MobileCardField({
  label,
  children,
  mono,
}: {
  label: string;
  children: ReactNode;
  /** Email / phone: right-aligned LTR for readability in RTL layout */
  mono?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div
        className={`min-w-0 text-sm break-words ${mono ? "font-mono text-right text-foreground" : ""}`}
        dir={mono ? "ltr" : undefined}
      >
        {children}
      </div>
    </div>
  );
}

function formatRegisteredAt(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale === "ar" ? AR_LOCALE_LATN : "en-GB", {
    dateStyle: "medium",
  });
}

/** Preserves all list page params when changing one pager (omits param when page is 1). */
function clientsUrl(pages: {
  coPage: number;
  drPage: number;
  dcPage: number;
  bcoPage: number;
  bdrPage: number;
  bdcPage: number;
}) {
  const sp = new URLSearchParams();
  if (pages.coPage > 1) sp.set("coPage", String(pages.coPage));
  if (pages.drPage > 1) sp.set("drPage", String(pages.drPage));
  if (pages.dcPage > 1) sp.set("dcPage", String(pages.dcPage));
  if (pages.bcoPage > 1) sp.set("bcoPage", String(pages.bcoPage));
  if (pages.bdrPage > 1) sp.set("bdrPage", String(pages.bdrPage));
  if (pages.bdcPage > 1) sp.set("bdcPage", String(pages.bdcPage));
  const q = sp.toString();
  return q ? `/dashboard/admin/clients?${q}` : "/dashboard/admin/clients";
}

function TablePagination({
  page,
  totalPages,
  total,
  pageSize,
  prevHref,
  nextHref,
  ariaLabel,
  t,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  prevHref: string;
  nextHref: string;
  ariaLabel: string;
  t: (key: string) => string;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = total === 0 ? 0 : Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {t(`${da}.clientsDirectoryRange`)
          .replace("{from}", String(from))
          .replace("{to}", String(to))
          .replace("{total}", String(total))}
      </p>
      {totalPages > 1 ? (
        <nav className="flex flex-wrap items-center gap-2" aria-label={ariaLabel}>
          {page <= 1 ? (
            <span className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-muted/40 px-3 text-sm font-medium text-muted-foreground opacity-60">
              {t("aria.previous")}
            </span>
          ) : (
            <Link
              href={prevHref}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
              scroll={false}
            >
              {t("aria.previous")}
            </Link>
          )}
          <span className="text-sm tabular-nums text-muted-foreground">
            {t(`${da}.clientsDirectoryPageStatus`)
              .replace("{page}", String(page))
              .replace("{pages}", String(totalPages))}
          </span>
          {page >= totalPages ? (
            <span className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-muted/40 px-3 text-sm font-medium text-muted-foreground opacity-60">
              {t("aria.next")}
            </span>
          ) : (
            <Link
              href={nextHref}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
              scroll={false}
            >
              {t("aria.next")}
            </Link>
          )}
        </nav>
      ) : null}
    </div>
  );
}

export function AdminClientsTabs({
  companies,
  registeredCarriers,
  directoryCarriers,
  blacklistedCompanies,
  blacklistedCarriers,
  blacklistedDirectoryCarriers,
  companyPage,
  companyTotal,
  companyTotalPages,
  driverPage,
  driverTotal,
  driverTotalPages,
  directoryPage,
  directoryTotal,
  directoryTotalPages,
  blacklistedCompanyPage,
  blacklistedCompanyTotal,
  blacklistedCompanyTotalPages,
  blacklistedDriverPage,
  blacklistedDriverTotal,
  blacklistedDriverTotalPages,
  blacklistedDirectoryPage,
  blacklistedDirectoryTotal,
  blacklistedDirectoryTotalPages,
  pageSize,
  currentUserId,
}: {
  companies: CompanyRow[];
  registeredCarriers: CarrierRow[];
  directoryCarriers: ShipmentCompanyDirectoryRow[];
  blacklistedCompanies: CompanyRow[];
  blacklistedCarriers: CarrierRow[];
  blacklistedDirectoryCarriers: ShipmentCompanyDirectoryRow[];
  companyPage: number;
  companyTotal: number;
  companyTotalPages: number;
  driverPage: number;
  driverTotal: number;
  driverTotalPages: number;
  directoryPage: number;
  directoryTotal: number;
  directoryTotalPages: number;
  blacklistedCompanyPage: number;
  blacklistedCompanyTotal: number;
  blacklistedCompanyTotalPages: number;
  blacklistedDriverPage: number;
  blacklistedDriverTotal: number;
  blacklistedDriverTotalPages: number;
  blacklistedDirectoryPage: number;
  blacklistedDirectoryTotal: number;
  blacklistedDirectoryTotalPages: number;
  pageSize: number;
  currentUserId: string;
}) {
  const { t, locale } = useI18n();
  const [tab, setTab] = useState<
    "companies" | "carriers" | "blacklistedCompanies" | "blacklistedCarriers"
  >("companies");

  const dateLabel = useMemo(() => (iso: string) => formatRegisteredAt(iso, locale), [locale]);

  const carriersTabCount = driverTotal + directoryTotal;
  const blacklistedCarriersTabCount = blacklistedDriverTotal + blacklistedDirectoryTotal;

  const pages = {
    coPage: companyPage,
    drPage: driverPage,
    dcPage: directoryPage,
    bcoPage: blacklistedCompanyPage,
    bdrPage: blacklistedDriverPage,
    bdcPage: blacklistedDirectoryPage,
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/20 p-1 sm:inline-flex sm:flex-wrap">
        <button
          type="button"
          onClick={() => setTab("companies")}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === "companies"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t(`${da}.clientsTabCompanies`)} ({companyTotal})
        </button>
        <button
          type="button"
          onClick={() => setTab("carriers")}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === "carriers"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t(`${da}.clientsTabCarriers`)} ({carriersTabCount})
        </button>
        <button
          type="button"
          onClick={() => setTab("blacklistedCompanies")}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === "blacklistedCompanies"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t(`${da}.clientsTabBlacklistedCompanies`)} ({blacklistedCompanyTotal})
        </button>
        <button
          type="button"
          onClick={() => setTab("blacklistedCarriers")}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === "blacklistedCarriers"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t(`${da}.clientsTabBlacklistedCarriers`)} ({blacklistedCarriersTabCount})
        </button>
      </div>

      {tab === "companies" ? (
        companyTotal === 0 ? (
          <p className="text-muted-foreground py-6">{t(`${da}.clientsEmptyCompanies`)}</p>
        ) : (
          <div className="space-y-3">
            <div className="md:hidden space-y-3">
              {companies.map((row) => (
                <article
                  key={row.id}
                  className="rounded-xl border border-border bg-card/50 p-4 shadow-sm"
                >
                  <div className="space-y-3">
                    <MobileCardField label={t(`${da}.clientsColEmail`)} mono>
                      <span className="break-all">{row.email}</span>
                    </MobileCardField>
                    <MobileCardField label={t(`${da}.clientsColCompanyName`)}>{row.companyName ?? "—"}</MobileCardField>
                    <MobileCardField label={t(`${da}.clientsColContact`)}>
                      {row.contactPerson ?? row.name ?? "—"}
                    </MobileCardField>
                    <MobileCardField label={t(`${da}.clientsColPhone`)} mono>
                      {row.phone ?? "—"}
                    </MobileCardField>
                    <MobileCardField label={t(`${da}.clientsColCity`)}>{row.city ?? "—"}</MobileCardField>
                    <MobileCardField label={t(`${da}.clientsColAddress`)}>{row.address ?? "—"}</MobileCardField>
                    <MobileCardField label={t(`${da}.clientsColRegistered`)}>
                      <span className="text-muted-foreground">{dateLabel(row.createdAt)}</span>
                    </MobileCardField>
                  </div>
                  <CompanyUserActions
                    row={row}
                    currentUserId={currentUserId}
                    listVariant="active"
                    uiVariant="card"
                  />
                </article>
              ))}
            </div>
            <div className="hidden md:block rounded-xl border border-border overflow-x-auto">
              <table className="w-full min-w-[860px] table-fixed border-collapse text-sm">
                {COLGROUP_8}
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColEmail`)}</th>
                    <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColCompanyName`)}</th>
                    <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColContact`)}</th>
                    <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColPhone`)}</th>
                    <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColCity`)}</th>
                    <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColAddress`)}</th>
                    <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColRegistered`)}</th>
                    <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.tableColActions`)}</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((row) => (
                    <tr key={row.id} className="border-b border-border/80 last:border-0">
                      <td className="p-3 align-top text-right break-words min-w-0">
                        <LtrCell>{row.email}</LtrCell>
                      </td>
                      <td className="p-3 align-top text-start break-words min-w-0">{row.companyName ?? "—"}</td>
                      <td className="p-3 align-top text-start break-words min-w-0">{row.contactPerson ?? row.name ?? "—"}</td>
                      <td className="p-3 align-top text-right break-words min-w-0">
                        <LtrCell>{row.phone ?? "—"}</LtrCell>
                      </td>
                      <td className="p-3 align-top text-start break-words min-w-0">{row.city ?? "—"}</td>
                      <td className="p-3 align-top text-start break-words min-w-0 text-foreground">{row.address ?? "—"}</td>
                      <td className="p-3 align-top text-start break-words min-w-0 text-muted-foreground">
                        {dateLabel(row.createdAt)}
                      </td>
                      <CompanyUserActions row={row} currentUserId={currentUserId} listVariant="active" uiVariant="table" />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePagination
              page={companyPage}
              totalPages={companyTotalPages}
              total={companyTotal}
              pageSize={pageSize}
              prevHref={clientsUrl({ ...pages, coPage: companyPage - 1 })}
              nextHref={clientsUrl({ ...pages, coPage: companyPage + 1 })}
              ariaLabel={t(`${da}.clientsCompaniesPaginationAria`)}
              t={t}
            />
          </div>
        )
      ) : tab === "blacklistedCompanies" ? (
        blacklistedCompanyTotal === 0 ? (
          <p className="text-muted-foreground py-6">{t(`${da}.clientsEmptyBlacklistedCompanies`)}</p>
        ) : (
          <div className="space-y-3">
            <div className="md:hidden space-y-3">
              {blacklistedCompanies.map((row) => (
                <article
                  key={row.id}
                  className="rounded-xl border border-border bg-card/50 p-4 shadow-sm"
                >
                  <div className="space-y-3">
                    <MobileCardField label={t(`${da}.clientsColEmail`)} mono>
                      <span className="break-all">{row.email}</span>
                    </MobileCardField>
                    <MobileCardField label={t(`${da}.clientsColCompanyName`)}>{row.companyName ?? "—"}</MobileCardField>
                    <MobileCardField label={t(`${da}.clientsColContact`)}>
                      {row.contactPerson ?? row.name ?? "—"}
                    </MobileCardField>
                    <MobileCardField label={t(`${da}.clientsColPhone`)} mono>
                      {row.phone ?? "—"}
                    </MobileCardField>
                    <MobileCardField label={t(`${da}.clientsColCity`)}>{row.city ?? "—"}</MobileCardField>
                    <MobileCardField label={t(`${da}.clientsColAddress`)}>{row.address ?? "—"}</MobileCardField>
                    <MobileCardField label={t(`${da}.clientsColRegistered`)}>
                      <span className="text-muted-foreground">{dateLabel(row.createdAt)}</span>
                    </MobileCardField>
                  </div>
                  <CompanyUserActions
                    row={row}
                    currentUserId={currentUserId}
                    listVariant="blacklisted"
                    uiVariant="card"
                  />
                </article>
              ))}
            </div>
            <div className="hidden md:block rounded-xl border border-border overflow-x-auto">
              <table className="w-full min-w-[860px] table-fixed border-collapse text-sm">
                {COLGROUP_8}
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColEmail`)}</th>
                    <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColCompanyName`)}</th>
                    <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColContact`)}</th>
                    <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColPhone`)}</th>
                    <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColCity`)}</th>
                    <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColAddress`)}</th>
                    <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColRegistered`)}</th>
                    <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.tableColActions`)}</th>
                  </tr>
                </thead>
                <tbody>
                  {blacklistedCompanies.map((row) => (
                    <tr key={row.id} className="border-b border-border/80 last:border-0">
                      <td className="p-3 align-top text-right break-words min-w-0">
                        <LtrCell>{row.email}</LtrCell>
                      </td>
                      <td className="p-3 align-top text-start break-words min-w-0">{row.companyName ?? "—"}</td>
                      <td className="p-3 align-top text-start break-words min-w-0">{row.contactPerson ?? row.name ?? "—"}</td>
                      <td className="p-3 align-top text-right break-words min-w-0">
                        <LtrCell>{row.phone ?? "—"}</LtrCell>
                      </td>
                      <td className="p-3 align-top text-start break-words min-w-0">{row.city ?? "—"}</td>
                      <td className="p-3 align-top text-start break-words min-w-0 text-foreground">{row.address ?? "—"}</td>
                      <td className="p-3 align-top text-start break-words min-w-0 text-muted-foreground">
                        {dateLabel(row.createdAt)}
                      </td>
                      <CompanyUserActions
                        row={row}
                        currentUserId={currentUserId}
                        listVariant="blacklisted"
                        uiVariant="table"
                      />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePagination
              page={blacklistedCompanyPage}
              totalPages={blacklistedCompanyTotalPages}
              total={blacklistedCompanyTotal}
              pageSize={pageSize}
              prevHref={clientsUrl({ ...pages, bcoPage: blacklistedCompanyPage - 1 })}
              nextHref={clientsUrl({ ...pages, bcoPage: blacklistedCompanyPage + 1 })}
              ariaLabel={t(`${da}.clientsBlacklistedCompaniesPaginationAria`)}
              t={t}
            />
          </div>
        )
      ) : tab === "carriers" ? (
        carriersTabCount === 0 ? (
          <p className="text-muted-foreground py-6">{t(`${da}.clientsEmptyCarriers`)}</p>
        ) : (
          <div className="space-y-10">
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">{t(`${da}.clientsSectionRegisteredCarriers`)}</h2>
              {driverTotal === 0 ? (
                <p className="text-sm text-muted-foreground">{t(`${da}.clientsRegisteredCarriersEmpty`)}</p>
              ) : (
                <div className="space-y-3">
                  <div className="md:hidden space-y-3">
                    {registeredCarriers.map((row) => (
                      <article
                        key={row.id}
                        className="rounded-xl border border-border bg-card/50 p-4 shadow-sm"
                      >
                        <div className="space-y-3">
                          <MobileCardField label={t(`${da}.clientsColCompanyName`)}>
                            {carrierRowCompanyName(row)}
                          </MobileCardField>
                          <MobileCardField label={t(`${da}.clientsColContact`)}>
                            {carrierRowRepresentative(row)}
                          </MobileCardField>
                          <MobileCardField label={t(`${da}.clientsColEmail`)} mono>
                            <span className="break-all">{row.email}</span>
                          </MobileCardField>
                          <MobileCardField label={t(`${da}.clientsColPhone`)} mono>
                            {row.phone ?? "—"}
                          </MobileCardField>
                          <MobileCardField label={t(`${da}.clientsColTruckTypes`)}>
                            <span className="text-muted-foreground">{carrierRowTruckTypes(row)}</span>
                          </MobileCardField>
                          <MobileCardField label={t(`${da}.clientsColDestinations`)}>
                            <span className="text-muted-foreground">{carrierRowDestinations(row)}</span>
                          </MobileCardField>
                          <MobileCardField label={t(`${da}.clientsColRegistered`)}>
                            <span className="text-muted-foreground">{dateLabel(row.createdAt)}</span>
                          </MobileCardField>
                        </div>
                        <DriverUserActions
                          row={row}
                          currentUserId={currentUserId}
                          listVariant="active"
                          uiVariant="card"
                        />
                      </article>
                    ))}
                  </div>
                  <div className="hidden md:block rounded-xl border border-border overflow-x-auto">
                    <table className="w-full min-w-[860px] table-fixed border-collapse text-sm">
                      {COLGROUP_8}
                      <thead>
                        <tr className="border-b border-border bg-muted/40">
                          <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColCompanyName`)}</th>
                          <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColContact`)}</th>
                          <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColEmail`)}</th>
                          <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColPhone`)}</th>
                          <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColTruckTypes`)}</th>
                          <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColDestinations`)}</th>
                          <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColRegistered`)}</th>
                          <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.tableColActions`)}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registeredCarriers.map((row) => (
                          <tr key={row.id} className="border-b border-border/80 last:border-0">
                            <td className="p-3 align-top text-start break-words min-w-0">{carrierRowCompanyName(row)}</td>
                            <td className="p-3 align-top text-start break-words min-w-0">{carrierRowRepresentative(row)}</td>
                            <td className="p-3 align-top text-right break-words min-w-0">
                              <LtrCell>{row.email}</LtrCell>
                            </td>
                            <td className="p-3 align-top text-right break-words min-w-0">
                              <LtrCell>{row.phone ?? "—"}</LtrCell>
                            </td>
                            <td className="p-3 align-top text-start break-words min-w-0 text-muted-foreground">
                              {carrierRowTruckTypes(row)}
                            </td>
                            <td className="p-3 align-top text-start break-words min-w-0 text-muted-foreground">
                              {carrierRowDestinations(row)}
                            </td>
                            <td className="p-3 align-top text-start break-words min-w-0 text-muted-foreground">
                              {dateLabel(row.createdAt)}
                            </td>
                            <DriverUserActions
                              row={row}
                              currentUserId={currentUserId}
                              listVariant="active"
                              uiVariant="table"
                            />
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <TablePagination
                    page={driverPage}
                    totalPages={driverTotalPages}
                    total={driverTotal}
                    pageSize={pageSize}
                    prevHref={clientsUrl({ ...pages, drPage: driverPage - 1 })}
                    nextHref={clientsUrl({ ...pages, drPage: driverPage + 1 })}
                    ariaLabel={t(`${da}.clientsRegisteredPaginationAria`)}
                    t={t}
                  />
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">{t(`${da}.clientsSectionDirectoryCarriers`)}</h2>
              {directoryTotal === 0 ? (
                <p className="text-sm text-muted-foreground">{t(`${da}.clientsDirectoryEmpty`)}</p>
              ) : (
                <>
                  <div className="md:hidden space-y-3">
                    {directoryCarriers.map((row) => (
                      <article
                        key={row.id}
                        className="rounded-xl border border-border bg-card/50 p-4 shadow-sm"
                      >
                        <div className="space-y-3">
                          <MobileCardField label={t(`${da}.clientsColCompanyName`)}>{row.company_name ?? "—"}</MobileCardField>
                          <MobileCardField label={t(`${da}.clientsColContact`)}>
                            {row.representative_name ?? "—"}
                          </MobileCardField>
                          <MobileCardField label={t(`${da}.clientsColEmail`)} mono>
                            <span className="break-all">{row.email ?? "—"}</span>
                          </MobileCardField>
                          <MobileCardField label={t(`${da}.clientsColPhone`)} mono>
                            {row.phone ?? "—"}
                          </MobileCardField>
                          <MobileCardField label={t(`${da}.clientsColTruckTypes`)}>
                            <span className="text-muted-foreground">{row.truck_types ?? "—"}</span>
                          </MobileCardField>
                          <MobileCardField label={t(`${da}.clientsColDestinations`)}>
                            <span className="text-muted-foreground">{row.destinations ?? "—"}</span>
                          </MobileCardField>
                          <MobileCardField label={t(`${da}.clientsColRegistered`)}>
                            <span className="text-muted-foreground">{dateLabel(row.createdAt)}</span>
                          </MobileCardField>
                        </div>
                        <DirectoryCarrierActions row={row} listVariant="active" uiVariant="card" />
                      </article>
                    ))}
                  </div>
                  <div className="hidden md:block rounded-xl border border-border overflow-x-auto">
                    <table className="w-full min-w-[860px] table-fixed border-collapse text-sm">
                      {COLGROUP_8}
                      <thead>
                        <tr className="border-b border-border bg-muted/40">
                          <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColCompanyName`)}</th>
                          <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColContact`)}</th>
                          <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColEmail`)}</th>
                          <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColPhone`)}</th>
                          <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColTruckTypes`)}</th>
                          <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColDestinations`)}</th>
                          <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColRegistered`)}</th>
                          <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.tableColActions`)}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {directoryCarriers.map((row) => (
                          <tr key={row.id} className="border-b border-border/80 last:border-0">
                            <td className="p-3 align-top text-start break-words min-w-0">{row.company_name ?? "—"}</td>
                            <td className="p-3 align-top text-start break-words min-w-0">{row.representative_name ?? "—"}</td>
                            <td className="p-3 align-top text-right break-words min-w-0">
                              <LtrCell>{row.email ?? "—"}</LtrCell>
                            </td>
                            <td className="p-3 align-top text-right break-words min-w-0">
                              <LtrCell>{row.phone ?? "—"}</LtrCell>
                            </td>
                            <td className="p-3 align-top text-start break-words min-w-0 text-muted-foreground">
                              {row.truck_types ?? "—"}
                            </td>
                            <td className="p-3 align-top text-start break-words min-w-0 text-muted-foreground">
                              {row.destinations ?? "—"}
                            </td>
                            <td className="p-3 align-top text-start break-words min-w-0 text-muted-foreground">
                              {dateLabel(row.createdAt)}
                            </td>
                            <DirectoryCarrierActions row={row} listVariant="active" uiVariant="table" />
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <TablePagination
                    page={directoryPage}
                    totalPages={directoryTotalPages}
                    total={directoryTotal}
                    pageSize={pageSize}
                    prevHref={clientsUrl({ ...pages, dcPage: directoryPage - 1 })}
                    nextHref={clientsUrl({ ...pages, dcPage: directoryPage + 1 })}
                    ariaLabel={t(`${da}.clientsDirectoryPaginationAria`)}
                    t={t}
                  />
                </>
              )}
            </section>
          </div>
        )
      ) : blacklistedCarriersTabCount === 0 ? (
        <p className="text-muted-foreground py-6">{t(`${da}.clientsEmptyBlacklistedCarriers`)}</p>
      ) : (
        <div className="space-y-10">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">{t(`${da}.clientsSectionBlacklistedRegisteredCarriers`)}</h2>
            {blacklistedDriverTotal === 0 ? (
              <p className="text-sm text-muted-foreground">{t(`${da}.clientsBlacklistedRegisteredCarriersEmpty`)}</p>
            ) : (
              <div className="space-y-3">
                <div className="md:hidden space-y-3">
                  {blacklistedCarriers.map((row) => (
                    <article
                      key={row.id}
                      className="rounded-xl border border-border bg-card/50 p-4 shadow-sm"
                    >
                      <div className="space-y-3">
                        <MobileCardField label={t(`${da}.clientsColCompanyName`)}>
                          {carrierRowCompanyName(row)}
                        </MobileCardField>
                        <MobileCardField label={t(`${da}.clientsColContact`)}>
                          {carrierRowRepresentative(row)}
                        </MobileCardField>
                        <MobileCardField label={t(`${da}.clientsColEmail`)} mono>
                          <span className="break-all">{row.email}</span>
                        </MobileCardField>
                        <MobileCardField label={t(`${da}.clientsColPhone`)} mono>
                          {row.phone ?? "—"}
                        </MobileCardField>
                        <MobileCardField label={t(`${da}.clientsColTruckTypes`)}>
                          <span className="text-muted-foreground">{carrierRowTruckTypes(row)}</span>
                        </MobileCardField>
                        <MobileCardField label={t(`${da}.clientsColDestinations`)}>
                          <span className="text-muted-foreground">{carrierRowDestinations(row)}</span>
                        </MobileCardField>
                        <MobileCardField label={t(`${da}.clientsColRegistered`)}>
                          <span className="text-muted-foreground">{dateLabel(row.createdAt)}</span>
                        </MobileCardField>
                      </div>
                      <DriverUserActions
                        row={row}
                        currentUserId={currentUserId}
                        listVariant="blacklisted"
                        uiVariant="card"
                      />
                    </article>
                  ))}
                </div>
                <div className="hidden md:block rounded-xl border border-border overflow-x-auto">
                  <table className="w-full min-w-[860px] table-fixed border-collapse text-sm">
                    {COLGROUP_8}
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColCompanyName`)}</th>
                        <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColContact`)}</th>
                        <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColEmail`)}</th>
                        <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColPhone`)}</th>
                        <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColTruckTypes`)}</th>
                        <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColDestinations`)}</th>
                        <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColRegistered`)}</th>
                        <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.tableColActions`)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blacklistedCarriers.map((row) => (
                        <tr key={row.id} className="border-b border-border/80 last:border-0">
                          <td className="p-3 align-top text-start break-words min-w-0">{carrierRowCompanyName(row)}</td>
                          <td className="p-3 align-top text-start break-words min-w-0">{carrierRowRepresentative(row)}</td>
                          <td className="p-3 align-top text-right break-words min-w-0">
                            <LtrCell>{row.email}</LtrCell>
                          </td>
                          <td className="p-3 align-top text-right break-words min-w-0">
                            <LtrCell>{row.phone ?? "—"}</LtrCell>
                          </td>
                          <td className="p-3 align-top text-start break-words min-w-0 text-muted-foreground">
                            {carrierRowTruckTypes(row)}
                          </td>
                          <td className="p-3 align-top text-start break-words min-w-0 text-muted-foreground">
                            {carrierRowDestinations(row)}
                          </td>
                          <td className="p-3 align-top text-start break-words min-w-0 text-muted-foreground">
                            {dateLabel(row.createdAt)}
                          </td>
                          <DriverUserActions
                            row={row}
                            currentUserId={currentUserId}
                            listVariant="blacklisted"
                            uiVariant="table"
                          />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <TablePagination
                  page={blacklistedDriverPage}
                  totalPages={blacklistedDriverTotalPages}
                  total={blacklistedDriverTotal}
                  pageSize={pageSize}
                  prevHref={clientsUrl({ ...pages, bdrPage: blacklistedDriverPage - 1 })}
                  nextHref={clientsUrl({ ...pages, bdrPage: blacklistedDriverPage + 1 })}
                  ariaLabel={t(`${da}.clientsBlacklistedRegisteredPaginationAria`)}
                  t={t}
                />
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">{t(`${da}.clientsSectionBlacklistedDirectoryCarriers`)}</h2>
            {blacklistedDirectoryTotal === 0 ? (
              <p className="text-sm text-muted-foreground">{t(`${da}.clientsBlacklistedDirectoryEmpty`)}</p>
            ) : (
              <>
                <div className="md:hidden space-y-3">
                  {blacklistedDirectoryCarriers.map((row) => (
                    <article
                      key={row.id}
                      className="rounded-xl border border-border bg-card/50 p-4 shadow-sm"
                    >
                      <div className="space-y-3">
                        <MobileCardField label={t(`${da}.clientsColCompanyName`)}>{row.company_name ?? "—"}</MobileCardField>
                        <MobileCardField label={t(`${da}.clientsColContact`)}>
                          {row.representative_name ?? "—"}
                        </MobileCardField>
                        <MobileCardField label={t(`${da}.clientsColEmail`)} mono>
                          <span className="break-all">{row.email ?? "—"}</span>
                        </MobileCardField>
                        <MobileCardField label={t(`${da}.clientsColPhone`)} mono>
                          {row.phone ?? "—"}
                        </MobileCardField>
                        <MobileCardField label={t(`${da}.clientsColTruckTypes`)}>
                          <span className="text-muted-foreground">{row.truck_types ?? "—"}</span>
                        </MobileCardField>
                        <MobileCardField label={t(`${da}.clientsColDestinations`)}>
                          <span className="text-muted-foreground">{row.destinations ?? "—"}</span>
                        </MobileCardField>
                        <MobileCardField label={t(`${da}.clientsColRegistered`)}>
                          <span className="text-muted-foreground">{dateLabel(row.createdAt)}</span>
                        </MobileCardField>
                      </div>
                      <DirectoryCarrierActions row={row} listVariant="blacklisted" uiVariant="card" />
                    </article>
                  ))}
                </div>
                <div className="hidden md:block rounded-xl border border-border overflow-x-auto">
                  <table className="w-full min-w-[860px] table-fixed border-collapse text-sm">
                    {COLGROUP_8}
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColCompanyName`)}</th>
                        <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColContact`)}</th>
                        <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColEmail`)}</th>
                        <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColPhone`)}</th>
                        <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColTruckTypes`)}</th>
                        <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColDestinations`)}</th>
                        <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.clientsColRegistered`)}</th>
                        <th className="p-3 text-start font-semibold align-bottom break-words">{t(`${da}.tableColActions`)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blacklistedDirectoryCarriers.map((row) => (
                        <tr key={row.id} className="border-b border-border/80 last:border-0">
                          <td className="p-3 align-top text-start break-words min-w-0">{row.company_name ?? "—"}</td>
                          <td className="p-3 align-top text-start break-words min-w-0">{row.representative_name ?? "—"}</td>
                          <td className="p-3 align-top text-right break-words min-w-0">
                            <LtrCell>{row.email ?? "—"}</LtrCell>
                          </td>
                          <td className="p-3 align-top text-right break-words min-w-0">
                            <LtrCell>{row.phone ?? "—"}</LtrCell>
                          </td>
                          <td className="p-3 align-top text-start break-words min-w-0 text-muted-foreground">
                            {row.truck_types ?? "—"}
                          </td>
                          <td className="p-3 align-top text-start break-words min-w-0 text-muted-foreground">
                            {row.destinations ?? "—"}
                          </td>
                          <td className="p-3 align-top text-start break-words min-w-0 text-muted-foreground">
                            {dateLabel(row.createdAt)}
                          </td>
                          <DirectoryCarrierActions row={row} listVariant="blacklisted" uiVariant="table" />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <TablePagination
                  page={blacklistedDirectoryPage}
                  totalPages={blacklistedDirectoryTotalPages}
                  total={blacklistedDirectoryTotal}
                  pageSize={pageSize}
                  prevHref={clientsUrl({ ...pages, bdcPage: blacklistedDirectoryPage - 1 })}
                  nextHref={clientsUrl({ ...pages, bdcPage: blacklistedDirectoryPage + 1 })}
                  ariaLabel={t(`${da}.clientsBlacklistedDirectoryPaginationAria`)}
                  t={t}
                />
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
