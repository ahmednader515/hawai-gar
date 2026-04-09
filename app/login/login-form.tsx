"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/components/providers/i18n-provider";

export function LoginForm() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const verifyEmail = searchParams.get("verifyEmail");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError(t("loginForm.invalidCredentials"));
        setLoading(false);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError(t("loginForm.genericError"));
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <form onSubmit={onSubmit} className="space-y-5">
        {verifyEmail === "success" ? (
          <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
            {t("loginForm.verifyEmailSuccess")}
          </p>
        ) : null}
        {verifyEmail === "expired" ? (
          <p className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
            {t("loginForm.verifyEmailExpired")}
          </p>
        ) : null}
        {verifyEmail === "invalid" ? (
          <p className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg">
            {t("loginForm.verifyEmailInvalid")}
          </p>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground font-medium">
            {t("loginForm.email")}
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder={t("loginForm.emailPlaceholder")}
            disabled={loading}
            className="h-12 bg-sky-50/80 dark:bg-sky-950/20 border-gray-200 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-foreground font-medium">
            {t("loginForm.password")}
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="h-12 bg-sky-50/80 dark:bg-sky-950/20 border-gray-200 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? t("loginForm.submitting") : t("loginForm.submit")}
        </button>
      </form>
    </div>
  );
}
