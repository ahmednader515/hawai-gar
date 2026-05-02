import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "@/lib/i18n/server";
import { getShipmentInvoiceSettings } from "@/lib/shipment-invoice-settings";
import { AdminInvoiceSettingsForm } from "./invoice-settings-form";

export default async function AdminInvoicePage() {
  const t = await getTranslations();
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const initial = await getShipmentInvoiceSettings();

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <h1 className="text-2xl font-bold">{t("dashboard.admin.invoiceSettingsTitle")}</h1>
      <p className="text-muted-foreground text-sm">{t("dashboard.admin.invoiceSettingsIntro")}</p>
      <AdminInvoiceSettingsForm initial={initial} />
    </div>
  );
}

