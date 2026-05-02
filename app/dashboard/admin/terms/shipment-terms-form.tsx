"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ShipmentTerms } from "@/lib/shipment-terms";
import { useI18n } from "@/components/providers/i18n-provider";

export function ShipmentTermsForm({ initial }: { initial: ShipmentTerms }) {
  const { t } = useI18n();
  const [titleAr, setTitleAr] = useState(initial.titleAr);
  const [titleEn, setTitleEn] = useState(initial.titleEn);
  const [contentAr, setContentAr] = useState(initial.contentAr);
  const [contentEn, setContentEn] = useState(initial.contentEn);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setTitleAr(initial.titleAr);
    setTitleEn(initial.titleEn);
    setContentAr(initial.contentAr);
    setContentEn(initial.contentEn);
  }, [initial.titleAr, initial.titleEn, initial.contentAr, initial.contentEn]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/shipment-terms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleAr: titleAr.trim(),
          titleEn: titleEn.trim(),
          contentAr: contentAr.trim(),
          contentEn: contentEn.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? t("dashboard.admin.termsSaveError") });
        return;
      }
      setMessage({ type: "success", text: t("dashboard.admin.termsSaveSuccess") });
    } catch {
      setMessage({ type: "error", text: t("dashboard.admin.termsGenericError") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-3xl">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="terms-title-ar">{t("dashboard.admin.termsTitleAr")}</Label>
          <Input
            id="terms-title-ar"
            value={titleAr}
            onChange={(e) => setTitleAr(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="terms-title-en">{t("dashboard.admin.termsTitleEn")}</Label>
          <Input
            id="terms-title-en"
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            required
            dir="ltr"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="terms-content-ar">{t("dashboard.admin.termsContentAr")}</Label>
        <textarea
          id="terms-content-ar"
          value={contentAr}
          onChange={(e) => setContentAr(e.target.value)}
          rows={8}
          required
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="terms-content-en">{t("dashboard.admin.termsContentEn")}</Label>
        <textarea
          id="terms-content-en"
          value={contentEn}
          onChange={(e) => setContentEn(e.target.value)}
          rows={8}
          required
          dir="ltr"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      {message && (
        <p
          className={`text-sm p-3 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </p>
      )}

      <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90">
        {saving ? t("dashboard.admin.termsSaving") : t("dashboard.admin.termsSave")}
      </Button>
    </form>
  );
}

