import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "@/lib/i18n/server";
import { getShipmentTerms } from "@/lib/shipment-terms";
import { ShipmentTermsForm } from "./shipment-terms-form";

export default async function AdminShipmentTermsPage() {
  const t = await getTranslations();
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const initial = await getShipmentTerms();

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <h1 className="text-2xl font-bold">{t("dashboard.admin.termsTitle")}</h1>
      <p className="text-muted-foreground text-sm">{t("dashboard.admin.termsIntro")}</p>
      <ShipmentTermsForm initial={initial} />
    </div>
  );
}

