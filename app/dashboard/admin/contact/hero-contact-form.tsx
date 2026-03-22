"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { HeroContactInfo } from "@/lib/site-settings";
import { useI18n } from "@/components/providers/i18n-provider";

export function HeroContactForm({ initial }: { initial: HeroContactInfo }) {
  const { t } = useI18n();
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setEmail(initial.email);
    setPhone(initial.phone ?? "");
  }, [initial.email, initial.phone]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/hero-contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), phone: phone.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? t("dashboard.admin.contactFormSaveError") });
        return;
      }
      setMessage({ type: "success", text: t("dashboard.admin.contactFormSaveSuccess") });
    } catch {
      setMessage({ type: "error", text: t("dashboard.admin.contactFormGenericError") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-xl">
      <div className="space-y-2">
        <Label htmlFor="hero-email">{t("dashboard.admin.contactFormEmailLabel")}</Label>
        <Input
          id="hero-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="info@example.com"
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="hero-phone">{t("dashboard.admin.contactFormPhoneLabel")}</Label>
        <Input
          id="hero-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t("dashboard.admin.contactFormPhonePlaceholder")}
          className="h-11"
        />
      </div>
      {message && (
        <p
          className={`text-sm p-3 rounded-lg ${
            message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </p>
      )}
      <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90">
        {saving ? t("dashboard.admin.contactFormSaving") : t("dashboard.admin.contactFormSave")}
      </Button>
    </form>
  );
}
