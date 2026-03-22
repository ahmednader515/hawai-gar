import Link from "next/link";
import Image from "next/image";
import { LoginToolbar } from "@/components/login-toolbar";
import { getTranslations } from "@/lib/i18n/server";

export default async function RegisterPage() {
  const t = await getTranslations();
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left side in RTL = image panel */}
      <div className="relative hidden lg:block min-h-screen">
        <Image
          src="/hero.png"
          alt=""
          fill
          className="object-cover"
          priority
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-foreground/40" />
      </div>

      {/* Right side in RTL = form panel */}
      <div className="flex flex-col bg-white min-h-screen">
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 overflow-auto relative">
          <LoginToolbar />
          <Link href="/" className="mb-6 sm:mb-8 shrink-0">
            <Image src="/logo.png" alt="hawai GAR" width={56} height={56} className="object-contain" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-2 shrink-0">
            {t("registerPage.title")}
          </h1>
          <div className="w-20 h-1 bg-primary rounded-full mb-6 sm:mb-8" />
          <div className="w-full max-w-md space-y-4">
            <Link
              href="/register/company"
              className="block w-full text-right rounded-xl border-2 border-gray-200 bg-white px-5 py-4 hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <div className="font-bold text-foreground mb-1">
                {t("registerPage.companyCardTitle")}
              </div>
              <div className="text-sm text-muted-foreground">{t("registerPage.companyCardDesc")}</div>
            </Link>

            <Link
              href="/register/carrier"
              className="block w-full text-right rounded-xl border-2 border-gray-200 bg-white px-5 py-4 hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <div className="font-bold text-foreground mb-1">{t("registerPage.carrierCardTitle")}</div>
              <div className="text-sm text-muted-foreground">{t("registerPage.carrierCardDesc")}</div>
            </Link>
          </div>
          <p className="mt-6 text-center text-muted-foreground text-sm shrink-0">
            {t("registerForm.hasAccount")}{" "}
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              {t("registerForm.goLogin")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
