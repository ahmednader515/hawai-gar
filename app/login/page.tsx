import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";
import Link from "next/link";
import Image from "next/image";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    const role = session.user.role;
    if (role === "ADMIN") redirect("/dashboard/admin");
    if (role === "SUPERVISOR") redirect("/dashboard/supervisor");
    if (role === "COMPANY") redirect("/dashboard/company");
    if (role === "DRIVER") redirect("/dashboard/client");
    redirect("/dashboard");
  }

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
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
          <Link href="/" className="mb-8 sm:mb-10">
            <Image src="/logo.png" alt="hawai GAR" width={56} height={56} className="object-contain" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-2">
            مرحباً بك في hawai GAR
          </h1>
          <div className="w-20 h-1 bg-primary rounded-full mb-8" />
          <LoginForm />
          <p className="mt-6 text-center text-muted-foreground text-sm">
            ليس لديك حساب؟{" "}
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              إنشاء حساب الآن
            </Link>
          </p>
          <div className="mt-10 pt-8 border-t border-gray-100 w-full max-w-sm">
            <p className="text-sm font-semibold text-foreground mb-4">بعد تسجيل الدخول ستتمكن من:</p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                البحث عن النقل وطلب رحلات بين المحطات
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </span>
                استقبال تنبيهات وتحديثات عن الطلبات
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </span>
                إدارة جميع شحناتك وطلبات النقل
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                الوصول من أي جهاز في أي وقت
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
