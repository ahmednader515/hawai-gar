import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getHeroContact } from "@/lib/site-settings";
import { HeroContactForm } from "./hero-contact-form";

export default async function AdminContactPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const contact = await getHeroContact();

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <h1 className="text-2xl font-bold">معلومات التواصل (هيرو الصفحة الرئيسية)</h1>
      <p className="text-muted-foreground text-sm">
        هذه البيانات تظهر في تبويب «تواصل معنا» في قسم الهيرو على الصفحة الرئيسية (زر راسلنا ورابط الأخبار).
      </p>
      <HeroContactForm initial={contact} />
    </div>
  );
}
