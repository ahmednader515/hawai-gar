"use client";

import { useState, useMemo } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/components/providers/i18n-provider";
import { TRUCK_SIZE_OPTIONS, TRUCK_TYPE_OPTIONS_BY_SIZE } from "@/lib/truck-options";

const inputClass =
  "h-11 bg-sky-50/80 dark:bg-sky-950/20 border-gray-200 focus:ring-primary/30 focus:border-primary";
const btnPrimary =
  "inline-flex h-11 min-h-11 items-center justify-center rounded-lg bg-primary px-5 py-2 sm:px-6 hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors disabled:opacity-70 disabled:cursor-not-allowed";

type Role = "COMPANY" | "DRIVER";

export function RegisterForm({ forcedRole }: { forcedRole?: Role }) {
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const initialRoleFromUrl = useMemo<Role | "">(
    () => (typeParam === "company" ? "COMPANY" : typeParam === "carrier" ? "DRIVER" : ""),
    [typeParam],
  );
  const initialRole = forcedRole ?? initialRoleFromUrl;
  const [step, setStep] = useState<"email" | "code" | "form">("email");
  const [email, setEmail] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [otpSendLoading, setOtpSendLoading] = useState(false);
  const [codeVerifyLoading, setCodeVerifyLoading] = useState(false);
  const [otpResendLoading, setOtpResendLoading] = useState(false);

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
  const isArabic = locale === "ar";
  const truckTypeOptions = useMemo(() => TRUCK_TYPE_OPTIONS_BY_SIZE[carCapacity] ?? [], [carCapacity]);

  async function sendRegistrationOtp() {
    const e = email.trim();
    if (!e.includes("@")) {
      setError(t("registerForm.errorGeneric"));
      return;
    }
    setOtpSendLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/request-registration-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : t("registerForm.errorGeneric"));
        return;
      }
      setStep("code");
      setVerifyCode("");
    } catch {
      setError(t("registerForm.errorTryAgain"));
    } finally {
      setOtpSendLoading(false);
    }
  }

  async function confirmRegistrationCode() {
    const e = email.trim();
    const code = verifyCode.replace(/\D/g, "").slice(0, 6);
    if (code.length !== 6) {
      setError(t("hero.emailVerify.codeRequired"));
      return;
    }
    setCodeVerifyLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-registration-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : t("hero.emailVerify.invalidOrExpired"));
        return;
      }
      setStep("form");
    } catch {
      setError(t("hero.emailVerify.verifyFailed"));
    } finally {
      setCodeVerifyLoading(false);
    }
  }

  async function resendRegistrationOtp() {
    const e = email.trim();
    if (!e) return;
    setOtpResendLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/request-registration-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : t("hero.emailVerify.verifyFailed"));
      }
    } catch {
      setError(t("hero.emailVerify.verifyFailed"));
    } finally {
      setOtpResendLoading(false);
    }
  }

  async function backFromCodeToEmail() {
    const e = email.trim();
    setError("");
    if (e) {
      try {
        await fetch("/api/auth/cancel-registration-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: e }),
        });
      } catch {
        /* ignore */
      }
    }
    setStep("email");
    setVerifyCode("");
  }

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
              registrationPreVerified: true,
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
              registrationPreVerified: true,
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

  if (step === "email") {
    return (
      <div className="w-full max-w-md space-y-4">
        <h2 className="text-lg font-semibold text-foreground">{t("registerForm.heading")}</h2>
        <p className="text-sm text-muted-foreground">{t("registerForm.emailVerifyIntro")}</p>
        <div className="space-y-2">
          <Label htmlFor="email">{t("registerForm.email")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("registerForm.placeholders.email")}
            className={inputClass}
          />
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>}
        <button
          type="button"
          onClick={() => void sendRegistrationOtp()}
          disabled={otpSendLoading || !email.trim()}
          className={`w-full ${btnPrimary}`}
        >
          {otpSendLoading ? t("hero.guestAccount.sendingCode") : t("hero.guestAccount.sendCode")}
        </button>
      </div>
    );
  }

  if (step === "code") {
    return (
      <div className="w-full max-w-md space-y-4">
        <h2 className="text-lg font-semibold text-foreground">{t("hero.emailVerify.title")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("hero.emailVerify.body").replace("{email}", email.trim())}
        </p>
        <div className="space-y-2">
          <Label htmlFor="reg-verify-code">{t("hero.emailVerify.codeLabel")}</Label>
          <Input
            id="reg-verify-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder={t("hero.emailVerify.codePlaceholder")}
            className={`${inputClass} text-center text-lg tracking-[0.25em] font-mono`}
          />
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={() => void backFromCodeToEmail()}
            className="h-11 w-full rounded-lg border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted sm:w-auto"
          >
            {t("hero.guestAccount.backToEmail")}
          </button>
          <button
            type="button"
            onClick={() => void resendRegistrationOtp()}
            disabled={otpResendLoading || codeVerifyLoading}
            className="h-11 w-full rounded-lg border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-70 sm:w-auto"
          >
            {otpResendLoading ? t("hero.emailVerify.resending") : t("hero.emailVerify.resend")}
          </button>
          <button
            type="button"
            onClick={() => void confirmRegistrationCode()}
            disabled={codeVerifyLoading || verifyCode.replace(/\D/g, "").length !== 6}
            className={`w-full sm:w-auto ${btnPrimary}`}
          >
            {codeVerifyLoading ? t("hero.guestAccount.verifyingCode") : t("hero.guestAccount.verifyCode")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <h2 className="text-lg font-semibold text-foreground mb-2">{t("registerForm.heading")}</h2>
      <p className="text-sm text-muted-foreground mb-5">
        <span className="font-medium text-foreground">{t("registerForm.verifiedEmailLabel")}: </span>
        <span className="break-all">{email.trim()}</span>
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!email || !password || !role) {
            setError(t("registerForm.allFieldsRequired"));
            return;
          }
          if (
            role === "DRIVER" &&
            (!fullName || !phone || !carPlate || !carCapacity || !carType)
          ) {
            setError(t("registerForm.allFieldsRequired"));
            return;
          }
          void onSubmit(e);
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="password">{t("registerForm.password")}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
              <Label>{t("registerForm.truckSize")}</Label>
              <select
                value={carCapacity}
                onChange={(e) => {
                  setCarCapacity(e.target.value);
                  setCarType("");
                }}
                required
                className={`${inputClass} w-full rounded-md px-3 focus:outline-none`}
              >
                <option value="">{t("registerForm.placeholders.truckSize")}</option>
                {TRUCK_SIZE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {isArabic ? option.ar : option.en}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>{t("registerForm.truckType")}</Label>
              <select
                value={carType}
                onChange={(e) => setCarType(e.target.value)}
                required
                disabled={!carCapacity}
                className={`${inputClass} w-full rounded-md px-3 focus:outline-none`}
              >
                <option value="">{t("registerForm.placeholders.truckType")}</option>
                {truckTypeOptions.map((option) => (
                  <option key={`${carCapacity}-${option.value}`} value={option.value}>
                    {isArabic ? option.ar : option.en}
                  </option>
                ))}
              </select>
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
