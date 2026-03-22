import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "@/lib/i18n/server";
import { NewsItemForm } from "../news-item-form";

export default async function NewNewsPage() {
  const t = await getTranslations();
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div>
      <Link href="/dashboard/admin/news" className="text-sm text-muted-foreground hover:underline mb-4 inline-block">
        {t("dashboard.admin.newsBackLink")}
      </Link>
      <h1 className="text-2xl font-bold mb-6">{t("dashboard.admin.newsNewPageTitle")}</h1>
      <NewsItemForm />
    </div>
  );
}
