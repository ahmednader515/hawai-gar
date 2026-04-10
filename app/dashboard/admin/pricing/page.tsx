import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "@/lib/i18n/server";
import { getShipmentPricingSettings } from "@/lib/shipment-pricing";
import { AdminPricingForm } from "./pricing-form";

export default async function AdminPricingPage() {
  const t = await getTranslations();
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const initial = await getShipmentPricingSettings();

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <h1 className="text-2xl font-bold">{t("dashboard.admin.pricingTitle")}</h1>
      <p className="text-muted-foreground text-sm">{t("dashboard.admin.pricingIntro")}</p>
      <AdminPricingForm initial={initial} />
    </div>
  );
}
