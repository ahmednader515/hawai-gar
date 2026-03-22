import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "@/lib/i18n/server";
import { NewsItemForm } from "../news-item-form";

export default async function EditNewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations();
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const { id } = await params;
  const item = await prisma.newsItem.findUnique({ where: { id } });
  if (!item) notFound();

  return (
    <div>
      <Link href="/dashboard/admin/news" className="text-sm text-muted-foreground hover:underline mb-4 inline-block">
        {t("dashboard.admin.newsBackLink")}
      </Link>
      <h1 className="text-2xl font-bold mb-6">{t("dashboard.admin.newsEditPageTitle")}</h1>
      <NewsItemForm item={item} />
    </div>
  );
}
