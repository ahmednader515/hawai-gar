"use client";

import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { useI18n } from "@/components/providers/i18n-provider";
import { InvoiceProofUploadButton } from "@/lib/uploadthing-components";

type Props = {
  requestId: string;
  initialImageUrl: string | null;
  onSaved: () => void;
};

export function CompanyInvoiceProofUpload({ requestId, initialImageUrl, onSaved }: Props) {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <div className="mt-2 rounded-lg border border-border bg-white/80 p-3 text-sm shadow-sm">
      <div className="font-semibold text-foreground">{t("hero.invoiceProofTitle")}</div>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{t("hero.invoiceProofHint")}</p>

      {initialImageUrl ? (
        <div className="mt-2 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{t("hero.invoiceProofUploaded")}</p>
          <a
            href={initialImageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex text-xs font-medium text-primary underline underline-offset-2 break-all"
          >
            {t("hero.invoiceProofView")}
          </a>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={initialImageUrl}
            alt=""
            className="max-h-40 w-full max-w-sm rounded-md border object-contain"
          />
        </div>
      ) : null}

      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}

      <div className="mt-3">
        <InvoiceProofUploadButton
          endpoint="invoiceProof"
          config={{ cn: twMerge }}
          className="w-full"
          appearance={{
            container: "flex w-full flex-col items-stretch justify-start gap-1.5",
            button:
              "min-h-9 w-full rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors focus-within:ring-0 focus-within:ring-offset-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[state=ready]:bg-primary data-[state=readying]:bg-primary/70 data-[state=uploading]:bg-primary/75 data-[state=disabled]:bg-muted data-[state=disabled]:text-muted-foreground data-[state=uploading]:after:bg-primary",
            allowedContent: "text-xs leading-relaxed text-muted-foreground",
            clearBtn: "text-xs font-medium text-primary underline underline-offset-2",
          }}
          content={{
            button: initialImageUrl ? t("hero.invoiceProofReplace") : t("hero.invoiceProofChoose"),
            allowedContent: t("hero.invoiceProofAllowed"),
          }}
          onUploadError={() => {
            setError(t("hero.invoiceProofUploadError"));
          }}
          onClientUploadComplete={async (res) => {
            setError(null);
            const file = res?.[0];
            const url = file?.ufsUrl ?? file?.url;
            if (!url) {
              setError(t("hero.invoiceProofUploadError"));
              return;
            }
            setSaving(true);
            try {
              const r = await fetch(`/api/shipment-requests/${requestId}/payment-proof`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ invoiceImageUrl: url }),
              });
              const data = await r.json().catch(() => ({}));
              if (!r.ok) {
                setError((data.error as string) ?? t("hero.invoiceProofSaveError"));
                return;
              }
              onSaved();
            } catch {
              setError(t("hero.invoiceProofSaveError"));
            } finally {
              setSaving(false);
            }
          }}
        />
      </div>
      {saving ? <p className="mt-1 text-xs text-muted-foreground">{t("hero.invoiceProofSaving")}</p> : null}
    </div>
  );
}
