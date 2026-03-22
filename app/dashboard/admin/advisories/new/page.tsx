import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "@/lib/i18n/server";
import { AdvisoryForm } from "../advisory-form";

export default async function NewAdvisoryPage() {
  const t = await getTranslations();
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div>
      <Link href="/dashboard/admin/advisories" className="text-sm text-muted-foreground hover:underline mb-4 inline-block">
        {t("dashboard.admin.advisoriesBackLink")}
      </Link>
      <h1 className="text-2xl font-bold mb-6">{t("dashboard.admin.advisoryNewPageTitle")}</h1>
      <AdvisoryForm />
    </div>
  );
}
