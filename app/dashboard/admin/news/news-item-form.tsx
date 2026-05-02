"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { NewsItem } from "@prisma/client";
import { useI18n } from "@/components/providers/i18n-provider";
import { useUploadThing } from "@/lib/uploadthing-components";

export function NewsItemForm({ item }: { item?: NewsItem }) {
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const img = imageUrl.trim();
    if (!img) {
      setError(t("adminForms.news.imageUrlRequired"));
      setLoading(false);
      return;
    }
    const body = {
      titleAr: formData.get("titleAr") as string,
      titleEn: (formData.get("titleEn") as string) || null,
      category: formData.get("category") as string,
      categoryEn: (formData.get("categoryEn") as string) || null,
      imageUrl: img,
      excerpt: (formData.get("excerpt") as string) || null,
      excerptEn: (formData.get("excerptEn") as string) || null,
      link: (formData.get("link") as string) || null,
      publishedAt: formData.get("publishedAt") as string,
    };
    try {
      if (item) {
        const res = await fetch(`/api/admin/news/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(await res.text());
        router.push("/dashboard/admin/news");
        router.refresh();
      } else {
        const res = await fetch("/api/admin/news", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(await res.text());
        router.push("/dashboard/admin/news");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("adminForms.errorSave"));
    } finally {
      setLoading(false);
    }
  };

  const defaultDate = item
    ? new Date(item.publishedAt).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const af = "adminForms.news";

  const { startUpload, isUploading } = useUploadThing("newsImage", {
    onUploadError: () => {
      setError(t(`${af}.imageUploadError`));
    },
  });

  useEffect(() => {
    setImageUrl(item?.imageUrl ?? "");
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [item?.imageUrl]);

  const previewUrl = useMemo(() => {
    if (!selectedFile) return null;
    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const pickLabel = imageUrl ? t(`${af}.imageUploadReplace`) : t(`${af}.imageUploadChoose`);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const f = e.target.files?.[0];
    if (!f) {
      setSelectedFile(null);
      return;
    }
    if (!/^image\/(png|jpeg|jpg)$/i.test(f.type)) {
      setError(t(`${af}.imageUploadError`));
      setSelectedFile(null);
      e.target.value = "";
      return;
    }
    setSelectedFile(f);
  };

  const onUpload = async () => {
    if (!selectedFile || isUploading) return;
    setError("");
    const uploaded = await startUpload([selectedFile]);
    const file = uploaded?.[0];
    const url = file?.ufsUrl ?? file?.url;
    if (!uploaded?.length || !url) {
      setError(t(`${af}.imageUploadError`));
      return;
    }
    setImageUrl(url);
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const busy = loading || isUploading;

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div>
            <Label htmlFor="titleAr">{t(`${af}.titleArRequired`)}</Label>
            <Input id="titleAr" name="titleAr" defaultValue={item?.titleAr} required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="titleEn">{t(`${af}.titleEn`)}</Label>
            <Input id="titleEn" name="titleEn" defaultValue={item?.titleEn ?? ""} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="category">{t(`${af}.categoryArRequired`)}</Label>
            <Input id="category" name="category" defaultValue={item?.category} required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="categoryEn">{t(`${af}.categoryEn`)}</Label>
            <Input
              id="categoryEn"
              name="categoryEn"
              defaultValue={(item as NewsItem & { categoryEn?: string | null })?.categoryEn ?? ""}
              className="mt-1"
              placeholder={t(`${af}.categoryEn`)}
            />
          </div>
          <div>
            <Label htmlFor="imageUrl">{t(`${af}.imageUrlRequired`)}</Label>
            <div className="mt-2 space-y-3">
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="sr-only"
                onChange={onFileChange}
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={busy}
                  className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {pickLabel}
                </button>
                <button
                  type="button"
                  onClick={() => void onUpload()}
                  disabled={!selectedFile || busy}
                  className="h-10 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted/70 disabled:opacity-50"
                >
                  {isUploading ? t(`${af}.imageUploadUploading`) : t(`${af}.imageUploadUpload`)}
                </button>
              </div>

              {(previewUrl || imageUrl) && (
                <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    {previewUrl ? t(`${af}.imageUploadPreviewLabel`) : t(`${af}.imageUploadUploadedLabel`)}
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl ?? imageUrl}
                    alt=""
                    className="max-h-56 w-full rounded-md border object-contain bg-background"
                  />
                  {imageUrl ? (
                    <p className="text-xs text-muted-foreground break-all" dir="ltr">
                      {imageUrl}
                    </p>
                  ) : null}
                </div>
              )}

              {/* keep a stable form field used by submit */}
              <input id="imageUrl" name="imageUrl" value={imageUrl} readOnly hidden />
              <p className="text-xs text-muted-foreground">{t(`${af}.imagePlaceholder`)}</p>
            </div>
          </div>
          <div>
            <Label htmlFor="excerpt">{t(`${af}.excerptAr`)}</Label>
            <Input id="excerpt" name="excerpt" defaultValue={item?.excerpt ?? ""} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="excerptEn">{t(`${af}.excerptEn`)}</Label>
            <Input
              id="excerptEn"
              name="excerptEn"
              defaultValue={(item as NewsItem & { excerptEn?: string | null })?.excerptEn ?? ""}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="link">{t(`${af}.link`)}</Label>
            <Input
              id="link"
              name="link"
              defaultValue={item?.link ?? ""}
              placeholder={t(`${af}.linkPlaceholder`)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="publishedAt">{t(`${af}.publishedAtRequired`)}</Label>
            <Input
              id="publishedAt"
              name="publishedAt"
              type="date"
              defaultValue={defaultDate}
              required
              className="mt-1"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? t(`${af}.saving`) : item ? t(`${af}.save`) : t(`${af}.add`)}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
