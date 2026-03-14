import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { CustomerGuidelinesSection } from "@/components/customer-guidelines-section";

export default async function AdminAdvisoriesPage() {
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
        <h1 className="text-2xl font-bold">إرشادات العملاء</h1>
        <Link
          href="/dashboard/admin/advisories/new"
          className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 shrink-0"
        >
          إضافة إرشاد
        </Link>
      </div>

      {/* Same content as homepage */}
      {advisoriesForSection.length > 0 ? (
        <CustomerGuidelinesSection
          items={advisoriesForSection}
          hideViewMore
        />
      ) : (
        <p className="text-muted-foreground py-8">لا توجد إرشادات. أضف عناصر من الزر أعلاه.</p>
      )}

      {/* Table for quick management */}
      <div className="rounded-lg border overflow-hidden overflow-x-auto min-w-0">
        <table className="w-full text-sm min-w-[320px]">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-right p-3 font-medium">العنوان</th>
              <th className="text-right p-3 font-medium">التاريخ</th>
              <th className="text-right p-3 font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-6 text-center text-muted-foreground">
                  لا توجد إرشادات.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-3">{item.titleAr}</td>
                  <td className="p-3">
                    {new Date(item.publishedAt).toLocaleDateString("ar-SA")}
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/dashboard/admin/advisories/${item.id}`}
                      className="text-primary hover:underline"
                    >
                      تعديل
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
