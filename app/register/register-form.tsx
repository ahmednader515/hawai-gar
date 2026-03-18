"use client";

import { useState, useMemo } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const inputClass =
  "h-11 bg-sky-50/80 dark:bg-sky-950/20 border-gray-200 focus:ring-primary/30 focus:border-primary";
const btnPrimary =
  "h-11 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors disabled:opacity-70 disabled:cursor-not-allowed";
const btnOutline =
  "h-11 rounded-lg border-2 border-gray-200 bg-white text-foreground font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-70";

type Role = "COMPANY" | "DRIVER";

export function RegisterForm({ forcedRole }: { forcedRole?: Role }) {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const initialRoleFromUrl = useMemo<Role | "">(
    () => (typeParam === "company" ? "COMPANY" : typeParam === "carrier" ? "DRIVER" : ""),
    [typeParam]
  );
  const initialRole = forcedRole ?? initialRoleFromUrl;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role | "">(initialRole);
  const [companyName, setCompanyName] = useState("");
  const [commercialRegister, setCommercialRegister] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [fullName, setFullName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [carPlate, setCarPlate] = useState("");
  const [carType, setCarType] = useState("");
  const [carCapacity, setCarCapacity] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload =
        role === "COMPANY"
          ? {
              email,
              password,
              role: "COMPANY",
              companyName,
              commercialRegister: commercialRegister || undefined,
              contactPerson,
              phone,
              address: address || undefined,
              city: city || undefined,
            }
          : {
              email,
              password,
              role: "DRIVER",
              fullName,
              phone,
              nationalId: nationalId || undefined,
              licenseNumber: licenseNumber || undefined,
              carPlate,
              carType: carType || undefined,
              carCapacity: carCapacity || undefined,
            };

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "حدث خطأ أثناء التسجيل");
        setLoading(false);
        return;
      }

      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (signInRes?.error) {
        setError("تم إنشاء الحساب لكن تسجيل الدخول فشل. جرّب تسجيل الدخول يدوياً.");
        setLoading(false);
        return;
      }
      router.push(data.redirect || "/dashboard");
      router.refresh();
    } catch {
      setError("حدث خطأ، حاول مرة أخرى");
      setLoading(false);
    }
  }

  const roleLabels: Record<Role, string> = {
    COMPANY: "الشركات (الشحن بين مواني ومدن المملكة والخليج العربي)",
    DRIVER: "تسجيل العملاء (شركات النقل)",
  };

  return (
    <div className="w-full max-w-md">
      <h2 className="text-lg font-semibold text-foreground mb-5">إنشاء حساب</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!email || !password || !role) {
            setError("جميع الحقول مطلوبة");
            return;
          }
          onSubmit(e);
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="example@company.com"
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">كلمة المرور</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <Label>نوع الحساب</Label>
          {forcedRole ? (
            <div className="w-full text-right rounded-lg border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-foreground">
              {roleLabels[forcedRole]}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3" role="group" aria-label="نوع الحساب">
              <button
                type="button"
                onClick={() => setRole("COMPANY")}
                className={`w-full text-right rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                  role === "COMPANY"
                    ? "border-slate-600 bg-slate-600 text-white"
                    : "border-gray-200 bg-white text-foreground hover:border-slate-400 hover:bg-slate-50"
                }`}
              >
                {roleLabels.COMPANY}
              </button>
              <button
                type="button"
                onClick={() => setRole("DRIVER")}
                className={`w-full text-right rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                  role === "DRIVER"
                    ? "border-slate-600 bg-slate-600 text-white"
                    : "border-gray-200 bg-white text-foreground hover:border-slate-400 hover:bg-slate-50"
                }`}
              >
                {roleLabels.DRIVER}
              </button>
            </div>
          )}
        </div>

        {role === "COMPANY" && (
          <>
            <div className="space-y-2">
              <Label>اسم الشركة</Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                placeholder="الشركة السعودية للنقل"
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label>السجل التجاري (اختياري)</Label>
              <Input
                value={commercialRegister}
                onChange={(e) => setCommercialRegister(e.target.value)}
                placeholder="1234567890"
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label>اسم المسؤول عن التواصل</Label>
              <Input
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                required
                placeholder="أحمد محمد"
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="05xxxxxxxx"
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label>العنوان (اختياري)</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="الرياض، حي ..."
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label>المدينة (اختياري)</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="الرياض"
                className={inputClass}
              />
            </div>
          </>
        )}

        {role === "DRIVER" && (
          <>
            <div className="space-y-2">
              <Label>الاسم الكامل</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="محمد أحمد العتيبي"
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="05xxxxxxxx"
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label>رقم الهوية (اختياري)</Label>
              <Input
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="1234567890"
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label>رقم رخصة القيادة (اختياري)</Label>
              <Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-2">
              <Label>رقم لوحة المركبة</Label>
              <Input
                value={carPlate}
                onChange={(e) => setCarPlate(e.target.value)}
                required
                placeholder="أ ب ج ١٢٣٤"
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label>نوع المركبة (اختياري)</Label>
              <Input
                value={carType}
                onChange={(e) => setCarType(e.target.value)}
                placeholder="شاحنة حاويات"
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label>سعة الحمولة (اختياري)</Label>
              <Input
                value={carCapacity}
                onChange={(e) => setCarCapacity(e.target.value)}
                placeholder="20 قدم / 40 قدم"
                className={inputClass}
              />
            </div>
          </>
        )}

        {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>}

        <button type="submit" disabled={loading} className={`w-full ${btnPrimary}`}>
          {loading ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
        </button>
      </form>
    </div>
  );
}
