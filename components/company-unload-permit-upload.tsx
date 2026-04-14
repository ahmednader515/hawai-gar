"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { useI18n } from "@/components/providers/i18n-provider";
import { useUploadThing } from "@/lib/uploadthing-components";

const MAX_BYTES = 4 * 1024 * 1024;

type Props = {
  requestId: string;
  initialImageUrl: string | null;
  onSaved: () => void;
};

export function CompanyUnloadPermitUpload({ requestId, initialImageUrl, onSaved }: Props) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { startUpload, isUploading } = useUploadThing("unloadPermitProof", {
    onUploadError: () => {
      setError(t("hero.unloadPermitUploadError"));
    },
  });

  useEffect(() => {
    if (initialImageUrl) {
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [initialImageUrl]);

  const previewUrl = useMemo(() => {
    if (!selectedFile) return null;
    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const pickLabel = initialImageUrl ? t("hero.unloadPermitReplace") : t("hero.unloadPermitChoose");

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const f = e.target.files?.[0];
    if (!f) {
      setSelectedFile(null);
      return;
    }
    if (!/^image\/(png|jpeg|jpg)$/i.test(f.type)) {
      setError(t("hero.unloadPermitUploadError"));
      setSelectedFile(null);
      e.target.value = "";
      return;
    }
    if (f.size > MAX_BYTES) {
      setError(t("hero.unloadPermitUploadError"));
      setSelectedFile(null);
      e.target.value = "";
      return;
    }
    setSelectedFile(f);
  };

  const onSubmit = async () => {
    if (!selectedFile || isUploading || saving) return;
    setError(null);
    const uploaded = await startUpload([selectedFile]);
    const file = uploaded?.[0];
    const url = file?.ufsUrl ?? file?.url;
    if (!uploaded?.length || !url) {
      setError(t("hero.unloadPermitUploadError"));
      return;
    }
    setSaving(true);
    try {
      const r = await fetch(`/api/shipment-requests/${requestId}/unload-permit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unloadPermitImageUrl: url }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError((data.error as string) ?? t("hero.unloadPermitSaveError"));
        return;
      }
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = "";
      onSaved();
    } catch {
      setError(t("hero.unloadPermitSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const busy = isUploading || saving;
  const btnClass =
    "min-h-9 flex-1 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50";

  return (
    <div className="mt-3 rounded-lg border border-border bg-white/80 p-3 text-sm shadow-sm">
      <div className="font-semibold text-foreground">{t("hero.unloadPermitTitle")}</div>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{t("hero.unloadPermitHint")}</p>

      {initialImageUrl ? (
        <div className="mt-2 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{t("hero.unloadPermitUploaded")}</p>
          <a
            href={initialImageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex text-xs font-medium text-primary underline underline-offset-2 break-all"
          >
            {t("hero.unloadPermitView")}
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

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          className="sr-only"
          onChange={onFileChange}
        />
        <button
          type="button"
          className={twMerge(btnClass, "bg-primary text-primary-foreground hover:bg-primary/90")}
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {pickLabel}
        </button>
        <button
          type="button"
          className={twMerge(btnClass, "border border-border bg-background text-foreground hover:bg-muted/80")}
          onClick={onSubmit}
          disabled={!selectedFile || busy}
        >
          {t("hero.unloadPermitSubmit")}
        </button>
      </div>

      {previewUrl && selectedFile ? (
        <div className="mt-3 space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">{t("hero.unloadPermitPreviewLabel")}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt=""
            className="max-h-48 w-full max-w-sm rounded-md border border-border bg-muted/30 object-contain"
          />
          <p className="text-xs text-muted-foreground break-all">{selectedFile.name}</p>
        </div>
      ) : null}

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t("hero.unloadPermitAllowed")}</p>

      {busy ? (
        <p className="mt-1 text-xs text-muted-foreground">
          {isUploading ? t("hero.unloadPermitUploading") : t("hero.unloadPermitSaving")}
        </p>
      ) : null}
    </div>
  );
}

