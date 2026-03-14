import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdvisoryForm } from "../advisory-form";

export default async function NewAdvisoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div>
      <Link href="/dashboard/admin/advisories" className="text-sm text-muted-foreground hover:underline mb-4 inline-block">
        ← إرشادات العملاء
      </Link>
      <h1 className="text-2xl font-bold mb-6">إضافة إرشاد جديد</h1>
      <AdvisoryForm />
    </div>
  );
}
