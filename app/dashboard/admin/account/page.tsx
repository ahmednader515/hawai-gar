import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getTranslations } from "@/lib/i18n/server";
import { AccountSettingsForm } from "@/components/account-settings-form";

export default async function AdminAccountPage() {
  const t = await getTranslations();
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });
  if (!user) redirect("/login");

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("dashboard.admin.accountTitle")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("dashboard.admin.accountIntro")}</p>
      </div>
      <AccountSettingsForm variant="admin" initialName={user.name} initialEmail={user.email} />
    </div>
  );
}
