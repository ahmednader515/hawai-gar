"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/providers/i18n-provider";
import {
  allowsAdminCarrierReassign,
  shouldClearWorkflowOnCarrierChange,
} from "@/lib/admin-carrier-reassign";
import { AdminInvoiceLinkFields } from "./invoice-link-fields";

export type CompatibleAssigneeRow = {
  source: "platformDriver" | "directoryCompany";
  id: string;
  company_name: string | null;
  representative_name: string | null;
  phone: string | null;
  email: string | null;
  truck_types: string | null;
  destinations: string | null;
  score: number;
};

function assigneeKey(row: CompatibleAssigneeRow): string {
  return row.source === "platformDriver" ? `platformDriver:${row.id}` : `directory:${row.id}`;
}

export function ShipmentRequestAdminActions({
  id,
  status,
  priceSar,
  estimatedPriceSar,
  invoiceLink: invoiceLinkProp,
  invoiceImageUrl,
  unloadPermitRequired,
  unloadPermitImageUrl,
  assignedShipmentCompany,
  assignedPlatformDriverName,
  initialShortlistKeys,
  compatibleAssignees,
}: {
  id: string;
  status: string;
  priceSar: number | null;
  estimatedPriceSar: number | null;
  invoiceLink: string | null;
  invoiceImageUrl: string | null;
  unloadPermitRequired: boolean;
  unloadPermitImageUrl: string | null;
  assignedShipmentCompany: {
    id: string;
    company_name: string | null;
    representative_name: string | null;
    phone: string | null;
    email: string | null;
    truck_types: string | null;
    destinations: string | null;
  } | null;
  /** When admin assigned a registered DRIVER (no directory row). */
  assignedPlatformDriverName: string | null;
  /** Saved shortlist (platform + directory keys). */
  initialShortlistKeys: string[];
  compatibleAssignees: CompatibleAssigneeRow[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState<
    | "approve"
    | "reject"
    | "invoice"
    | "paymentApprove"
    | "paymentReject"
    | "assignCarrier"
    | "shortlist"
    | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const [editedPriceSar, setEditedPriceSar] = useState<string>(() =>
    priceSar == null ? "" : String(Math.round(priceSar)),
  );
  const [priceChangeNotice, setPriceChangeNotice] = useState("");
  const [invoiceLinkInput, setInvoiceLinkInput] = useState(() => invoiceLinkProp ?? "");
  const [shortlistKeys, setShortlistKeys] = useState<string[]>(() => [...initialShortlistKeys]);
  const [companySearch, setCompanySearch] = useState("");

  const a = "dashboard.admin";

  const canCarrierDecide = status === "CARRIER_ACCEPTED" || status === "CARRIER_REFUSED";
  const canAssignCarrier = allowsAdminCarrierReassign(status);
  const showReassignWorkflowWarning = shouldClearWorkflowOnCarrierChange(status);

  const canEditInvoiceLink =
    canCarrierDecide ||
    status === "ADMIN_APPROVED" ||
    status === "AWAITING_PAYMENT_APPROVAL" ||
    status === "COMPLETE";

  useEffect(() => {
    setInvoiceLinkInput(invoiceLinkProp ?? "");
  }, [invoiceLinkProp]);

  useEffect(() => {
    setShortlistKeys([...initialShortlistKeys]);
  }, [initialShortlistKeys]);

  function toggleShortlistKey(key: string) {
    setShortlistKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  function shortlistKeySelected(key: string): boolean {
    return shortlistKeys.includes(key);
  }

  const parsedFinalPriceSar = useMemo(() => {
    const raw = editedPriceSar.trim();
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.round(n) : null;
  }, [editedPriceSar]);

  const priceDiffersFromEstimate =
    estimatedPriceSar != null &&
    parsedFinalPriceSar != null &&
    Math.round(estimatedPriceSar) !== parsedFinalPriceSar;

  async function assignImmediateCarrier() {
    if (shortlistKeys.length !== 1) {
      setError(t(`${a}.shipmentActionsAssignImmediateOneOnly`));
      return;
    }
    const selectedAssigneeKey = shortlistKeys[0];
    setLoading("assignCarrier");
    setError(null);
    try {
      const body =
        selectedAssigneeKey.startsWith("platformDriver:")
          ? { carrierUserId: selectedAssigneeKey.slice("platformDriver:".length) }
          : { shipmentCompanyId: selectedAssigneeKey.slice("directory:".length) };
      const res = await fetch(`/api/admin/shipment-requests/${id}/assign-company`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data.error as string) ?? t(`${a}.shipmentActionsErrorGeneric`));
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function saveCarrierShortlist() {
    if (shortlistKeys.length === 0) {
      setError(t(`${a}.shipmentActionsShortlistRequired`));
      return;
    }
    setLoading("shortlist");
    setError(null);
    try {
      const items = shortlistKeys.map((key) =>
        key.startsWith("platformDriver:")
          ? { kind: "DRIVER" as const, targetId: key.slice("platformDriver:".length) }
          : { kind: "COMPANY" as const, targetId: key.slice("directory:".length) },
      );
      const res = await fetch(`/api/admin/shipment-requests/${id}/invitees`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data.error as string) ?? t(`${a}.shipmentActionsErrorGeneric`));
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function saveInvoiceLink(clear: boolean) {
    setLoading("invoice");
    setError(null);
    try {
      const invoiceLink = clear ? "" : invoiceLinkInput.trim();
      const res = await fetch(`/api/admin/shipment-requests/${id}/invoice-link`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceLink }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data.error as string) ?? t(`${a}.shipmentActionsErrorGeneric`));
        return;
      }
      if (clear) setInvoiceLinkInput("");
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function sendPaymentProofReview(decision: "approve" | "reject") {
    setLoading(decision === "approve" ? "paymentApprove" : "paymentReject");
    setError(null);
    try {
      const res = await fetch(`/api/admin/shipment-requests/${id}/payment-proof-review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data.error as string) ?? t(`${a}.shipmentActionsErrorGeneric`));
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function sendCarrierDecision(decision: "approve" | "reject") {
    setLoading(decision);
    setError(null);
    try {
      const priceSarNum =
        decision === "approve"
          ? (() => {
              const raw = editedPriceSar.trim();
              if (!raw) return null;
              const n = Number(raw);
              return Number.isFinite(n) ? n : null;
            })()
          : null;

      if (decision === "approve" && priceSarNum == null) {
        setError(t(`${a}.shipmentActionsErrorPriceRequired`));
        return;
      }

      const est = estimatedPriceSar;
      const roundedFinal = priceSarNum != null ? Math.round(priceSarNum) : null;
      const needsNotice =
        decision === "approve" &&
        typeof est === "number" &&
        roundedFinal != null &&
        Math.round(est) !== roundedFinal;

      if (needsNotice && !priceChangeNotice.trim()) {
        setError(t(`${a}.shipmentActionsPriceChangeNoticeRequired`));
        return;
      }

      const res = await fetch(`/api/admin/shipment-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          priceSar: priceSarNum,
          priceChangeNotice: needsNotice ? priceChangeNotice.trim() : "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data.error as string) ?? t(`${a}.shipmentActionsErrorGeneric`));
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  const actionBusy = loading === "approve" || loading === "reject";
  const assignBusy = loading === "assignCarrier" || loading === "shortlist";
  const paymentReviewBusy = loading === "paymentApprove" || loading === "paymentReject";
  const q = companySearch.trim().toLowerCase();
  const filteredAssignees = compatibleAssignees.filter((company) => {
    if (!q) return true;
    const hay = [
      company.company_name,
      company.representative_name,
      company.phone,
      company.email,
      company.truck_types,
      company.destinations,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });

  return (
    <div className="pt-2 space-y-4">
      {error && (
        <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      {canAssignCarrier && (
        <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">{t(`${a}.shipmentActionsAssignTitle`)}</p>
            <p className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {t(`${a}.shipmentActionsCompaniesCount`).replace(
                "{count}",
                String(filteredAssignees.length),
              )}
            </p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{t(`${a}.shipmentActionsShortlistHint`)}</p>
          {showReassignWorkflowWarning ? (
            <p className="rounded-lg border border-amber-200/90 bg-amber-50/90 px-3 py-2 text-xs font-medium text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
              {t(`${a}.shipmentActionsReassignWorkflowWarning`)}
            </p>
          ) : null}
          {compatibleAssignees.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t(`${a}.shipmentActionsNoCompatible`)}</p>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="shipment-company-search">{t(`${a}.shipmentActionsAssignLabel`)}</Label>
                <Input
                  id="shipment-company-search"
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  placeholder={t(`${a}.shipmentActionsSearchPlaceholder`)}
                  disabled={assignBusy}
                />
              </div>

              <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg border border-border bg-background/80 p-2">
                {filteredAssignees.length === 0 ? (
                  <p className="px-2 py-3 text-xs text-muted-foreground">
                    {t(`${a}.shipmentActionsNoSearchResults`)}
                  </p>
                ) : (
                  filteredAssignees.map((company) => {
                    const key = assigneeKey(company);
                    const isSelected = shortlistKeySelected(key);
                    return (
                      <div
                        key={key}
                        className={cn(
                          "flex gap-2 rounded-lg border px-2 py-2 transition-colors",
                          isSelected
                            ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                            : "border-border bg-background",
                        )}
                      >
                        <input
                          type="checkbox"
                          className="mt-1 size-4 shrink-0 accent-primary"
                          checked={isSelected}
                          onChange={() => toggleShortlistKey(key)}
                          disabled={assignBusy}
                          aria-label={t(`${a}.shipmentActionsShortlistToggle`)}
                        />
                        <button
                          type="button"
                          onClick={() => toggleShortlistKey(key)}
                          disabled={assignBusy}
                          className="min-w-0 flex-1 rounded-md px-1 py-0.5 text-start transition-colors hover:bg-muted/30"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground">
                              {company.company_name ?? t(`${a}.shipmentActionsUnknownCompany`)}
                            </p>
                            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                              {company.source === "platformDriver" ? (
                                <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                                  {t(`${a}.shipmentActionsPlatformCarrierBadge`)}
                                </span>
                              ) : (
                                <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                  {t(`${a}.shipmentActionsDirectoryCarrierBadge`)}
                                </span>
                              )}
                              <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                {t(`${a}.shipmentActionsScore`).replace("{score}", String(company.score))}
                              </span>
                            </div>
                          </div>
                          {company.representative_name ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {company.representative_name}
                            </p>
                          ) : null}
                          {(company.phone || company.email) && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {company.phone ? <span dir="ltr">{company.phone}</span> : null}
                              {company.phone && company.email ? " • " : null}
                              {company.email ? <span dir="ltr">{company.email}</span> : null}
                            </p>
                          )}
                          {(company.truck_types || company.destinations) && (
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {[company.truck_types, company.destinations].filter(Boolean).join(" • ")}
                            </p>
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  type="button"
                  onClick={() => void saveCarrierShortlist()}
                  disabled={assignBusy || shortlistKeys.length === 0}
                >
                  {loading === "shortlist"
                    ? t(`${a}.shipmentActionsLoading`)
                    : t(`${a}.shipmentActionsSaveShortlist`)}
                </Button>
                <Button
                  size="sm"
                  type="button"
                  variant="secondary"
                  onClick={() => void assignImmediateCarrier()}
                  disabled={assignBusy || shortlistKeys.length !== 1}
                >
                  {loading === "assignCarrier"
                    ? t(`${a}.shipmentActionsLoading`)
                    : t(`${a}.shipmentActionsAssignButton`)}
                </Button>
              </div>
            </>
          )}
          {assignedShipmentCompany && (
            <p className="text-xs text-muted-foreground">
              {t(`${a}.shipmentActionsAssignedCurrent`)} {assignedShipmentCompany.company_name ?? "—"}
            </p>
          )}
          {!assignedShipmentCompany && assignedPlatformDriverName && (
            <p className="text-xs text-muted-foreground">
              {t(`${a}.shipmentActionsAssignedCurrent`)} {assignedPlatformDriverName}
            </p>
          )}
        </div>
      )}

      {canCarrierDecide && (
        <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
          <p className="text-sm font-medium">{t(`${a}.shipmentActionsSectionTitle`)}</p>
          <div className="space-y-1.5">
            <Label htmlFor="admin-price-sar">{t(`${a}.shipmentActionsFinalPriceLabel`)}</Label>
            <Input
              id="admin-price-sar"
              type="number"
              step={1}
              inputMode="numeric"
              value={editedPriceSar}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  setEditedPriceSar("");
                  return;
                }
                const n = Number(raw);
                if (!Number.isFinite(n)) return;
                setEditedPriceSar(String(Math.round(n)));
              }}
              disabled={actionBusy}
            />
            {estimatedPriceSar != null && (
              <p className="text-xs text-muted-foreground">
                {t(`${a}.shipmentActionsEstimatedPrice`).replace(
                  "{amount}",
                  String(Math.round(estimatedPriceSar)),
                )}
              </p>
            )}
            {priceDiffersFromEstimate && (
              <div className="space-y-1.5 pt-1">
                <Label htmlFor="admin-price-change-notice">{t(`${a}.shipmentActionsPriceChangeNoticeLabel`)}</Label>
                <textarea
                  id="admin-price-change-notice"
                  rows={4}
                  value={priceChangeNotice}
                  onChange={(e) => setPriceChangeNotice(e.target.value)}
                  placeholder={t(`${a}.shipmentActionsPriceChangeNoticePlaceholder`)}
                  disabled={actionBusy}
                  className={cn(
                    "flex min-h-[5rem] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors outline-none",
                    "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                    "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 resize-y",
                  )}
                />
              </div>
            )}
          </div>

          {canEditInvoiceLink ? (
            <AdminInvoiceLinkFields
              variant="belowPrice"
              invoiceLinkInput={invoiceLinkInput}
              onInvoiceLinkChange={setInvoiceLinkInput}
              invoiceLinkProp={invoiceLinkProp}
              loadingInvoice={loading === "invoice"}
              onSave={() => void saveInvoiceLink(false)}
              onClear={() => void saveInvoiceLink(true)}
              t={t}
            />
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => sendCarrierDecision("approve")} disabled={actionBusy}>
              {loading === "approve"
                ? t(`${a}.shipmentActionsLoading`)
                : t(`${a}.shipmentActionsApprove`)}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => sendCarrierDecision("reject")}
              disabled={actionBusy}
            >
              {loading === "reject" ? t(`${a}.shipmentActionsLoading`) : t(`${a}.shipmentActionsReject`)}
            </Button>
          </div>
        </div>
      )}

      {status === "ADMIN_REJECTED" && (
        <p className="text-xs text-muted-foreground">
          {t(`${a}.shipmentActionsAdminRejected`)} {t(`${a}.shipmentActionsAdminRejectedPickCarrier`)}
        </p>
      )}

      {status === "AWAITING_PAYMENT_APPROVAL" && invoiceImageUrl && (
        <div className="space-y-3 rounded-xl border border-amber-200/80 bg-amber-50/90 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
          <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">
            {t(`${a}.shipmentActionsPaymentProofWaiting`)}
          </p>
          <div className="rounded-lg border border-border bg-background p-2 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={invoiceImageUrl}
              alt=""
              className="max-h-64 w-full max-w-md rounded-md object-contain mx-auto"
            />
          </div>
          <a
            href={invoiceImageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex text-sm font-medium text-primary underline underline-offset-2"
          >
            {t(`${a}.shipmentActionsPaymentProofOpen`)}
          </a>
          {unloadPermitRequired && unloadPermitImageUrl ? (
            <div className="space-y-2 rounded-xl border border-border bg-background/70 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                {t(`${a}.shipmentActionsUnloadPermitOnFile`)}
              </p>
              <div className="rounded-lg border border-border bg-background p-2 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={unloadPermitImageUrl}
                  alt=""
                  className="max-h-56 w-full max-w-md rounded-md object-contain mx-auto"
                />
              </div>
              <a
                href={unloadPermitImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex text-sm font-medium text-primary underline underline-offset-2"
              >
                {t(`${a}.shipmentActionsUnloadPermitOpen`)}
              </a>
            </div>
          ) : unloadPermitRequired ? (
            <p className="text-xs text-muted-foreground">
              {t(`${a}.shipmentActionsUnloadPermitMissing`)}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              type="button"
              onClick={() => void sendPaymentProofReview("approve")}
              disabled={paymentReviewBusy}
            >
              {loading === "paymentApprove"
                ? t(`${a}.shipmentActionsLoading`)
                : t(`${a}.shipmentActionsPaymentProofApprove`)}
            </Button>
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={() => void sendPaymentProofReview("reject")}
              disabled={paymentReviewBusy}
            >
              {loading === "paymentReject"
                ? t(`${a}.shipmentActionsLoading`)
                : t(`${a}.shipmentActionsPaymentProofReject`)}
            </Button>
          </div>
        </div>
      )}

      {status === "ADMIN_APPROVED" && (
        <p className="text-sm font-medium text-emerald-800 bg-emerald-50 rounded-lg px-3 py-2">
          {t(`${a}.shipmentActionsPriceApproved`)}
        </p>
      )}

      {status === "COMPLETE" && (
        <>
          <p className="text-sm font-medium text-emerald-800 bg-emerald-50 rounded-lg px-3 py-2">
            {t(`${a}.shipmentActionsComplete`)}
          </p>
          {invoiceImageUrl ? (
            <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-3">
              <p className="text-xs font-medium text-muted-foreground">{t(`${a}.shipmentActionsPaymentProofOnFile`)}</p>
              <div className="rounded-lg border border-border bg-background p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={invoiceImageUrl}
                  alt=""
                  className="max-h-48 w-full max-w-md rounded-md object-contain mx-auto"
                />
              </div>
              <a
                href={invoiceImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex text-sm font-medium text-primary underline underline-offset-2"
              >
                {t(`${a}.shipmentActionsPaymentProofOpen`)}
              </a>
            </div>
          ) : null}
          {unloadPermitRequired && unloadPermitImageUrl ? (
            <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-3">
              <p className="text-xs font-medium text-muted-foreground">{t(`${a}.shipmentActionsUnloadPermitOnFile`)}</p>
              <div className="rounded-lg border border-border bg-background p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={unloadPermitImageUrl}
                  alt=""
                  className="max-h-48 w-full max-w-md rounded-md object-contain mx-auto"
                />
              </div>
              <a
                href={unloadPermitImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex text-sm font-medium text-primary underline underline-offset-2"
              >
                {t(`${a}.shipmentActionsUnloadPermitOpen`)}
              </a>
            </div>
          ) : null}
        </>
      )}

      {!canCarrierDecide && canEditInvoiceLink && (
        <div className="space-y-3 rounded-xl border border-primary/25 bg-primary/[0.04] p-4">
          <AdminInvoiceLinkFields
            variant="standalone"
            invoiceLinkInput={invoiceLinkInput}
            onInvoiceLinkChange={setInvoiceLinkInput}
            invoiceLinkProp={invoiceLinkProp}
            loadingInvoice={loading === "invoice"}
            onSave={() => void saveInvoiceLink(false)}
            onClear={() => void saveInvoiceLink(true)}
            t={t}
          />
        </div>
      )}
    </div>
  );
}
