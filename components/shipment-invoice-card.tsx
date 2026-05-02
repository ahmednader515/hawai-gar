import { SarPriceDisplay } from "@/components/sar-price-display";
import type { ShipmentInvoiceData } from "@/lib/shipment-invoice";
import type { InvoiceBankAccount } from "@/lib/shipment-invoice-settings";
import { formatDashboardDateTime } from "@/lib/format-datetime";

type InvoiceCardLabels = {
  title: string;
  invoiceNumber: string;
  issuedAt: string;
  amount: string;
  route: string;
  requestDetails: string;
  shipmentType: string;
  containerSize: string;
  containersCount: string;
  contactPhone: string;
  distance: string;
  pickupDate: string;
  unloadPermitRequired: string;
  notes: string;
  yes: string;
  no: string;
  bankAccounts: string;
};

function BankAccountsList({ bankAccounts }: { bankAccounts: InvoiceBankAccount[] }) {
  return (
    <div className="space-y-2">
      {bankAccounts.map((bank) => (
        <div key={bank.id} className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm">
          <p className="font-semibold">{bank.bankName}</p>
          <p className="text-muted-foreground">{bank.accountHolder}</p>
          <p className="font-mono text-xs break-all" dir="ltr">
            {bank.iban}
          </p>
          {bank.accountNumber ? (
            <p className="text-xs text-muted-foreground" dir="ltr">
              A/C: {bank.accountNumber}
            </p>
          ) : null}
          {bank.swiftCode ? (
            <p className="text-xs text-muted-foreground" dir="ltr">
              SWIFT: {bank.swiftCode}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function ShipmentInvoiceCard({
  invoice,
  locale,
  labels,
  actions,
}: {
  invoice: ShipmentInvoiceData;
  locale: "ar" | "en";
  labels: InvoiceCardLabels;
  actions?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-4 text-foreground">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold">{labels.title}</h3>
          <p className="text-xs text-muted-foreground">{invoice.settings.companyName}</p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={invoice.settings.logoUrl} alt="" className="h-10 w-auto object-contain" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
          <p className="text-xs text-muted-foreground">{labels.invoiceNumber}</p>
          <p className="font-semibold">{invoice.invoiceNumber}</p>
        </div>
        <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
          <p className="text-xs text-muted-foreground">{labels.issuedAt}</p>
          <p className="font-semibold">{formatDashboardDateTime(invoice.issuedAt, locale)}</p>
        </div>
        <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
          <p className="text-xs text-muted-foreground">{labels.route}</p>
          <p className="font-semibold leading-relaxed">
            {invoice.fromText} → {invoice.toText}
          </p>
        </div>
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
          <p className="text-xs text-muted-foreground">{labels.amount}</p>
          <SarPriceDisplay
            amount={invoice.finalPriceSar}
            locale={locale}
            amountClassName="text-lg font-extrabold tabular-nums text-foreground"
            wordsClassName="sr-only"
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">{labels.requestDetails}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm">
            <p className="text-xs text-muted-foreground">{labels.shipmentType}</p>
            <p className="font-semibold">{invoice.shipmentType || "—"}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm">
            <p className="text-xs text-muted-foreground">{labels.containerSize}</p>
            <p className="font-semibold">{invoice.containerSize || "—"}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm">
            <p className="text-xs text-muted-foreground">{labels.containersCount}</p>
            <p className="font-semibold">{invoice.containersCount || "—"}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm">
            <p className="text-xs text-muted-foreground">{labels.contactPhone}</p>
            <p className="font-semibold" dir="ltr">
              {invoice.contactPhone || "—"}
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm">
            <p className="text-xs text-muted-foreground">{labels.distance}</p>
            <p className="font-semibold">
              {typeof invoice.distanceKm === "number" ? `${invoice.distanceKm.toFixed(1)} km` : "—"}
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm">
            <p className="text-xs text-muted-foreground">{labels.pickupDate}</p>
            <p className="font-semibold">{invoice.pickupDate || "—"}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm sm:col-span-2">
            <p className="text-xs text-muted-foreground">{labels.unloadPermitRequired}</p>
            <p className="font-semibold">
              {invoice.unloadPermitRequired ? labels.yes : labels.no}
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm sm:col-span-2">
            <p className="text-xs text-muted-foreground">{labels.notes}</p>
            <p className="font-semibold whitespace-pre-wrap">{invoice.notes || "—"}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">{labels.bankAccounts}</p>
        <BankAccountsList bankAccounts={invoice.bankAccounts} />
      </div>

      {locale === "ar" ? (
        <p className="text-xs text-muted-foreground leading-relaxed">{invoice.settings.notesAr}</p>
      ) : (
        <p className="text-xs text-muted-foreground leading-relaxed">{invoice.settings.notesEn}</p>
      )}

      {actions ? <div className="flex flex-wrap gap-2 pt-1">{actions}</div> : null}
    </div>
  );
}

