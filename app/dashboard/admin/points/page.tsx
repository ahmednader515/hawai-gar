import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "@/lib/i18n/server";
import { getPointsSettings } from "@/lib/points-settings";
import { PointsSettingsForm } from "./points-settings-form";

export default async function AdminPointsPage() {
  const t = await getTranslations();
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const initial = await getPointsSettings();

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <h1 className="text-2xl font-bold">{t("dashboard.admin.pointsTitle")}</h1>
      <p className="text-muted-foreground text-sm">{t("dashboard.admin.pointsIntro")}</p>
      <PointsSettingsForm initial={initial} />
    </div>
  );
}
