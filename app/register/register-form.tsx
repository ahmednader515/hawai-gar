"use client";

import { useState, useMemo } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/components/providers/i18n-provider";

const inputClass =
  "h-11 bg-sky-50/80 dark:bg-sky-950/20 border-gray-200 focus:ring-primary/30 focus:border-primary";
const btnPrimary =
  "h-11 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors disabled:opacity-70 disabled:cursor-not-allowed";
const btnOutline =
  "h-11 rounded-lg border-2 border-gray-200 bg-white text-foreground font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-70";

type Role = "COMPANY" | "DRIVER";

export function RegisterForm({ forcedRole }: { forcedRole?: Role }) {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const initialRoleFromUrl = useMemo<Role | "">(
    () => (typeParam === "company" ? "COMPANY" : typeParam === "carrier" ? "DRIVER" : ""),
    [typeParam]
  );
  const initialRole = forcedRole ?? initialRoleFromUrl;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        setError(data.error || t("registerForm.errorGeneric"));
        setLoading(false);
        return;
      }

      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (signInRes?.error) {
        setError(t("registerForm.errorSignInAfter"));
        setLoading(false);
        return;
      }
      router.push(data.redirect || "/dashboard");
      router.refresh();
    } catch {
      setError(t("registerForm.errorTryAgain"));
      setLoading(false);
    }
  }

  const roleLabels: Record<Role, string> = {
    COMPANY: t("registerPage.companyCardTitle"),
    DRIVER: t("registerPage.carrierCardTitle"),
  };

  return (
    <div className="w-full max-w-md">
      <h2 className="text-lg font-semibold text-foreground mb-5">{t("registerForm.heading")}</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!email || !password || !role) {
            setError(t("registerForm.allFieldsRequired"));
            return;
          }
          onSubmit(e);
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="email">{t("registerForm.email")}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder={t("registerForm.placeholders.email")}
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t("registerForm.password")}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className={`${inputClass} pe-28`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute end-2 top-1/2 z-10 -translate-y-1/2 rounded-md px-2 py-1.5 text-xs font-semibold text-primary underline-offset-2 hover:bg-primary/10 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-pressed={showPassword}
              aria-controls="password"
              aria-label={
                showPassword ? t("registerForm.hidePassword") : t("registerForm.showPassword")
              }
            >
              {showPassword ? t("registerForm.hidePassword") : t("registerForm.showPassword")}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("registerForm.accountType")}</Label>
          {forcedRole ? (
            <div className="w-full text-right rounded-lg border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-foreground">
              {roleLabels[forcedRole]}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3" role="group" aria-label={t("registerForm.accountTypeAria")}>
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
              <Label>{t("registerForm.companyName")}</Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                placeholder={t("registerForm.placeholders.companyName")}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("registerForm.commercialRegisterOptional")}</Label>
              <Input
                value={commercialRegister}
                onChange={(e) => setCommercialRegister(e.target.value)}
                placeholder="1234567890"
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("registerForm.contactPerson")}</Label>
              <Input
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                required
                placeholder={t("registerForm.placeholders.contactPerson")}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("registerForm.phone")}</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder={t("registerForm.placeholders.phone")}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("registerForm.addressOptional")}</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t("registerForm.placeholders.address")}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("registerForm.cityOptional")}</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={t("registerForm.placeholders.city")}
                className={inputClass}
              />
            </div>
          </>
        )}

        {role === "DRIVER" && (
          <>
            <div className="space-y-2">
              <Label>{t("registerForm.fullName")}</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder={t("registerForm.placeholders.fullName")}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("registerForm.phone")}</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder={t("registerForm.placeholders.phone")}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("registerForm.nationalIdOptional")}</Label>
              <Input
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="1234567890"
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("registerForm.licenseNumberOptional")}</Label>
              <Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-2">
              <Label>{t("registerForm.carPlate")}</Label>
              <Input
                value={carPlate}
                onChange={(e) => setCarPlate(e.target.value)}
                required
                placeholder={t("registerForm.placeholders.carPlate")}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("registerForm.carTypeOptional")}</Label>
              <Input
                value={carType}
                onChange={(e) => setCarType(e.target.value)}
                placeholder={t("registerForm.placeholders.carType")}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("registerForm.carCapacityOptional")}</Label>
              <Input
                value={carCapacity}
                onChange={(e) => setCarCapacity(e.target.value)}
                placeholder={t("registerForm.placeholders.carCapacity")}
                className={inputClass}
              />
            </div>
          </>
        )}

        {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>}

        <button type="submit" disabled={loading} className={`w-full ${btnPrimary}`}>
          {loading ? t("registerForm.submitting") : t("registerForm.submit")}
        </button>
      </form>
    </div>
  );
}
