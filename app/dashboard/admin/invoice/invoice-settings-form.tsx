"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/components/providers/i18n-provider";
import {
  type InvoiceBankAccount,
  type ShipmentInvoiceSettings,
} from "@/lib/shipment-invoice-settings";
import { useUploadThing } from "@/lib/uploadthing-components";

function createEmptyAccount(): InvoiceBankAccount {
  return {
    id: crypto.randomUUID(),
    bankName: "",
    accountHolder: "",
    iban: "",
    accountNumber: "",
    swiftCode: "",
  };
}

export function AdminInvoiceSettingsForm({ initial }: { initial: ShipmentInvoiceSettings }) {
  const { t } = useI18n();
  const [companyName, setCompanyName] = useState(initial.companyName);
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl);
  const [notesAr, setNotesAr] = useState(initial.notesAr);
  const [notesEn, setNotesEn] = useState(initial.notesEn);
  const [accounts, setAccounts] = useState<InvoiceBankAccount[]>(
    initial.bankAccounts?.length ? initial.bankAccounts : [createEmptyAccount()],
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { startUpload, isUploading } = useUploadThing("invoiceLogo", {
    onUploadError: () => setMessage({ type: "error", text: t("dashboard.admin.invoiceSettingsLogoUploadError") }),
  });

  const onUploadLogo = async () => {
    if (!logoFile || isUploading) return;
    const uploaded = await startUpload([logoFile]);
    const file = uploaded?.[0];
    const url = file?.ufsUrl ?? file?.url;
    if (!url) {
      setMessage({ type: "error", text: t("dashboard.admin.invoiceSettingsLogoUploadError") });
      return;
    }
    setLogoUrl(url);
    setLogoFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const updateAccount = (id: string, key: keyof InvoiceBankAccount, value: string) => {
    setAccounts((prev) => prev.map((acc) => (acc.id === id ? { ...acc, [key]: value } : acc)));
  };

  const addAccount = () => setAccounts((prev) => [...prev, createEmptyAccount()]);
  const removeAccount = (id: string) => setAccounts((prev) => prev.filter((a) => a.id !== id));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/shipment-invoice-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          logoUrl: logoUrl.trim(),
          notesAr: notesAr.trim(),
          notesEn: notesEn.trim(),
          bankAccounts: accounts,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? t("dashboard.admin.invoiceSettingsSaveError") });
        return;
      }
      setMessage({ type: "success", text: t("dashboard.admin.invoiceSettingsSaveSuccess") });
    } catch {
      setMessage({ type: "error", text: t("dashboard.admin.invoiceSettingsGenericError") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-4xl">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="invoice-company">{t("dashboard.admin.invoiceSettingsCompanyName")}</Label>
          <Input
            id="invoice-company"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invoice-logo-url">{t("dashboard.admin.invoiceSettingsLogoUrl")}</Label>
          <Input
            id="invoice-logo-url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            dir="ltr"
            required
          />
        </div>
      </div>

      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="space-y-2">
          <Label>{t("dashboard.admin.invoiceSettingsLogoUploadLabel")}</Label>
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="sr-only"
              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
            />
            <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>
              {t("dashboard.admin.invoiceSettingsLogoChoose")}
            </Button>
            <Button type="button" variant="outline" disabled={!logoFile || isUploading} onClick={() => void onUploadLogo()}>
              {isUploading ? t("dashboard.admin.invoiceSettingsLogoUploading") : t("dashboard.admin.invoiceSettingsLogoUpload")}
            </Button>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt="" className="h-16 w-auto object-contain" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="invoice-notes-ar">{t("dashboard.admin.invoiceSettingsNotesAr")}</Label>
          <textarea
            id="invoice-notes-ar"
            value={notesAr}
            onChange={(e) => setNotesAr(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invoice-notes-en">{t("dashboard.admin.invoiceSettingsNotesEn")}</Label>
          <textarea
            id="invoice-notes-en"
            value={notesEn}
            onChange={(e) => setNotesEn(e.target.value)}
            rows={5}
            dir="ltr"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t("dashboard.admin.invoiceSettingsBankAccounts")}</h2>
          <Button type="button" variant="secondary" size="sm" onClick={addAccount}>
            {t("dashboard.admin.invoiceSettingsAddBankAccount")}
          </Button>
        </div>
        <div className="space-y-3">
          {accounts.map((acc) => (
            <div key={acc.id} className="rounded-lg border border-border p-3 space-y-2">
              <div className="grid gap-2 md:grid-cols-2">
                <Input
                  placeholder={t("dashboard.admin.invoiceSettingsBankName")}
                  value={acc.bankName}
                  onChange={(e) => updateAccount(acc.id, "bankName", e.target.value)}
                />
                <Input
                  placeholder={t("dashboard.admin.invoiceSettingsAccountHolder")}
                  value={acc.accountHolder}
                  onChange={(e) => updateAccount(acc.id, "accountHolder", e.target.value)}
                />
                <Input
                  placeholder={t("dashboard.admin.invoiceSettingsIban")}
                  value={acc.iban}
                  onChange={(e) => updateAccount(acc.id, "iban", e.target.value)}
                  dir="ltr"
                />
                <Input
                  placeholder={t("dashboard.admin.invoiceSettingsAccountNumber")}
                  value={acc.accountNumber}
                  onChange={(e) => updateAccount(acc.id, "accountNumber", e.target.value)}
                  dir="ltr"
                />
                <Input
                  placeholder={t("dashboard.admin.invoiceSettingsSwift")}
                  value={acc.swiftCode}
                  onChange={(e) => updateAccount(acc.id, "swiftCode", e.target.value)}
                  dir="ltr"
                />
              </div>
              {accounts.length > 1 ? (
                <Button type="button" variant="outline" size="sm" onClick={() => removeAccount(acc.id)}>
                  {t("dashboard.admin.invoiceSettingsRemoveBankAccount")}
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {message && (
        <p className={`text-sm p-3 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
          {message.text}
        </p>
      )}

      <Button type="submit" disabled={saving || isUploading} className="bg-primary hover:bg-primary/90">
        {saving ? t("dashboard.admin.invoiceSettingsSaving") : t("dashboard.admin.invoiceSettingsSave")}
      </Button>
    </form>
  );
}

