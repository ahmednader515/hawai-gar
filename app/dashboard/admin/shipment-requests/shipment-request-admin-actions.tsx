"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/components/providers/i18n-provider";
import { AdminInvoiceLinkFields } from "./invoice-link-fields";

export function ShipmentRequestAdminActions({
  id,
  status,
  priceSar,
  estimatedPriceSar,
  invoiceLink: invoiceLinkProp,
  invoiceImageUrl,
}: {
  id: string;
  status: string;
  priceSar: number | null;
  estimatedPriceSar: number | null;
  invoiceLink: string | null;
  invoiceImageUrl: string | null;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | "invoice" | "paymentApprove" | "paymentReject" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const [editedPriceSar, setEditedPriceSar] = useState<string>(() =>
    priceSar == null ? "" : String(Math.round(priceSar)),
  );
  const [invoiceLinkInput, setInvoiceLinkInput] = useState(() => invoiceLinkProp ?? "");

  const a = "dashboard.admin";

  const canCarrierDecide = status === "CARRIER_ACCEPTED" || status === "CARRIER_REFUSED";
  const isPendingCarrier = status === "PENDING_CARRIER";

  const canEditInvoiceLink =
    canCarrierDecide ||
    status === "ADMIN_APPROVED" ||
    status === "AWAITING_PAYMENT_APPROVAL" ||
    status === "COMPLETE";

  useEffect(() => {
    setInvoiceLinkInput(invoiceLinkProp ?? "");
  }, [invoiceLinkProp]);

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

      const res = await fetch(`/api/admin/shipment-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, priceSar: priceSarNum }),
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
  const paymentReviewBusy = loading === "paymentApprove" || loading === "paymentReject";

  return (
    <div className="pt-2 space-y-4">
      {error && (
        <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      {isPendingCarrier && (
        <p className="text-xs text-muted-foreground">{t(`${a}.shipmentActionsPendingCarrier`)}</p>
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
        <p className="text-xs text-muted-foreground">{t(`${a}.shipmentActionsAdminRejected`)}</p>
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
