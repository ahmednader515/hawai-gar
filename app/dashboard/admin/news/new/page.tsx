import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { NewsItemForm } from "../news-item-form";

export default async function NewNewsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div>
      <Link href="/dashboard/admin/news" className="text-sm text-muted-foreground hover:underline mb-4 inline-block">
        ← الأخبار
      </Link>
      <h1 className="text-2xl font-bold mb-6">إضافة خبر جديد</h1>
      <NewsItemForm />
    </div>
  );
}
