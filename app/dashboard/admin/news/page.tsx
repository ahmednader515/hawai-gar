import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { getTranslations } from "@/lib/i18n/server";
import { NewsSection } from "@/components/news-section";
import { NewsManageTable } from "./news-manage-table";

export default async function AdminNewsPage() {
  const t = await getTranslations();
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const items = await prisma.newsItem.findMany({
    orderBy: { publishedAt: "desc" },
  });

  const newsForSection = items.map((i) => ({
    id: i.id,
    titleAr: i.titleAr,
    titleEn: i.titleEn,
    category: i.category,
    imageUrl: i.imageUrl,
    excerpt: i.excerpt,
    link: `/dashboard/admin/news/${i.id}`,
    publishedAt: i.publishedAt,
  }));

  return (
    <div className="w-full min-w-0 max-w-full space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{t("dashboard.admin.newsTitle")}</h1>
        <Link
          href="/dashboard/admin/news/new"
          className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 shrink-0"
        >
          {t("dashboard.admin.newsAdd")}
        </Link>
      </div>

      {/* Same content as homepage */}
      {newsForSection.length > 0 ? (
        <NewsSection
          items={newsForSection}
          hideViewAll
          maxItems={99}
        />
      ) : (
        <p className="text-muted-foreground py-8">{t("dashboard.admin.newsEmpty")}</p>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">{t("dashboard.admin.newsQuickManage")}</h2>
        <NewsManageTable
          items={items.map((i) => ({
            id: i.id,
            titleAr: i.titleAr,
            category: i.category,
            publishedAt: i.publishedAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
