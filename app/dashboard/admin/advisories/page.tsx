import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { getTranslations } from "@/lib/i18n/server";
import { CustomerGuidelinesSection } from "@/components/customer-guidelines-section";
import { AdvisoriesManageTable } from "./advisories-manage-table";

export default async function AdminAdvisoriesPage() {
  const t = await getTranslations();
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const items = await prisma.customerAdvisory.findMany({
    orderBy: { publishedAt: "desc" },
  });

  const advisoriesForSection = items.map((i) => ({
    id: i.id,
    titleAr: i.titleAr,
    titleEn: i.titleEn,
    excerpt: i.excerpt,
    publishedAt: i.publishedAt,
    link: `/dashboard/admin/advisories/${i.id}`,
  }));

  return (
    <div className="w-full min-w-0 max-w-full space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{t("dashboard.admin.advisoriesTitle")}</h1>
        <Link
          href="/dashboard/admin/advisories/new"
          className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 shrink-0"
        >
          {t("dashboard.admin.advisoryAdd")}
        </Link>
      </div>

      {/* Same content as homepage */}
      {advisoriesForSection.length > 0 ? (
        <CustomerGuidelinesSection
          items={advisoriesForSection}
          hideViewMore
        />
      ) : (
        <p className="text-muted-foreground py-8">{t("dashboard.admin.advisoriesEmpty")}</p>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">{t("dashboard.admin.newsQuickManage")}</h2>
        <AdvisoriesManageTable
          items={items.map((i) => ({
            id: i.id,
            titleAr: i.titleAr,
            publishedAt: i.publishedAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
