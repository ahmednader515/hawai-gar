"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { ShipmentInvoiceCard } from "@/components/shipment-invoice-card";
import type { ShipmentInvoiceData } from "@/lib/shipment-invoice";

export function CompanyShipmentInvoiceCard({
  requestId,
  locale,
  extra,
}: {
  requestId: string;
  locale: "ar" | "en";
  extra?: React.ReactNode;
}) {
  const { t } = useI18n();
  const [invoice, setInvoice] = useState<ShipmentInvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/shipment-requests/${requestId}/invoice`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!canceled) setError((data.error as string) ?? "Could not load invoice");
          return;
        }
        if (!canceled) setInvoice(data as ShipmentInvoiceData);
      } catch {
        if (!canceled) setError("Could not load invoice");
      } finally {
        if (!canceled) setLoading(false);
      }
    };
    void load();
    return () => {
      canceled = true;
    };
  }, [requestId]);

  if (loading) {
    return (
      <div className="mt-2 rounded-lg border border-border bg-white/80 p-3 text-sm">
        {t("common.loading")}
      </div>
    );
  }
  if (error || !invoice) {
    return (
      <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error ?? t("hero.invoiceMarkPaidError")}
      </p>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <p className="text-sm text-foreground">{t("hero.invoiceCardIntro")}</p>
      <ShipmentInvoiceCard
        invoice={invoice}
        locale={locale}
        labels={{
          title: t("hero.invoiceCardTitle"),
          invoiceNumber: t("hero.invoiceNumberLabel"),
          issuedAt: t("hero.invoiceIssuedAtLabel"),
          amount: t("hero.invoiceAmountLabel"),
          route: t("hero.route"),
          requestDetails: t("hero.invoiceRequestDetailsTitle"),
          shipmentType: t("hero.shipmentType"),
          containerSize: t("hero.containerSize"),
          containersCount: t("hero.containersCount"),
          contactPhone: t("hero.contactPhone"),
          distance: t("hero.distance"),
          pickupDate: t("hero.pickupDate"),
          unloadPermitRequired: t("hero.unloadPermitQuestion"),
          notes: t("hero.notes"),
          yes: t("hero.yes"),
          no: t("hero.no"),
          bankAccounts: t("hero.invoiceBankAccountsLabel"),
        }}
        actions={
          <>
            <a
              href={`/shipment-requests/${requestId}/invoice`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted"
            >
              {t("hero.invoiceOpen")}
            </a>
            <a
              href={`/shipment-requests/${requestId}/invoice?print=1`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted"
            >
              {t("hero.invoicePrintSavePdf")}
            </a>
          </>
        }
      />
      {extra}
    </div>
  );
}

