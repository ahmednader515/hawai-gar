import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "@/lib/i18n/server";
import { getHeroContact } from "@/lib/site-settings";
import { HeroContactForm } from "./hero-contact-form";

export default async function AdminContactPage() {
  const t = await getTranslations();
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const contact = await getHeroContact();

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <h1 className="text-2xl font-bold">{t("dashboard.admin.contactTitle")}</h1>
      <p className="text-muted-foreground text-sm">
        {t("dashboard.admin.contactIntro")}
      </p>
      <HeroContactForm initial={contact} />
    </div>
  );
}
