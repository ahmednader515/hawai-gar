import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "@/lib/i18n/server";
import { ShipmentInvoiceCard } from "@/components/shipment-invoice-card";
import { getShipmentInvoiceData } from "@/lib/shipment-invoice";
import { InvoicePrintButton } from "@/components/invoice-print-button";
import { InvoiceAutoPrint } from "@/components/invoice-auto-print";

export default async function ShipmentInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ print?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations();
  const invoice = await getShipmentInvoiceData(id, {
    userId: session.user.id,
    role: session.user.role,
  });
  const sp = (await searchParams) ?? {};
  const shouldAutoPrint = String(sp.print ?? "") === "1";

  if (!invoice) redirect("/dashboard");

  const lang = locale === "ar" ? "ar" : "en";

  return (
    <main className="min-h-screen bg-muted/20 p-4 print:bg-white print:p-0">
      <InvoiceAutoPrint enabled={shouldAutoPrint} />
      <div className="mx-auto max-w-3xl space-y-3 print:space-y-0">
        <div className="flex items-center justify-end print:hidden">
          <InvoicePrintButton label={t("hero.invoicePrintSavePdf")} />
        </div>
        <div className="mx-auto w-full max-w-2xl print:max-w-none">
          <ShipmentInvoiceCard
            invoice={invoice}
            locale={lang}
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
          />
        </div>
      </div>
    </main>
  );
}

