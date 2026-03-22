"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { NewsItem } from "@prisma/client";
import { useI18n } from "@/components/providers/i18n-provider";

export function NewsItemForm({ item }: { item?: NewsItem }) {
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const body = {
      titleAr: formData.get("titleAr") as string,
      titleEn: (formData.get("titleEn") as string) || null,
      category: formData.get("category") as string,
      categoryEn: (formData.get("categoryEn") as string) || null,
      imageUrl: formData.get("imageUrl") as string,
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
            <Input
              id="imageUrl"
              name="imageUrl"
              defaultValue={item?.imageUrl}
              required
              placeholder={t(`${af}.imagePlaceholder`)}
              className="mt-1"
            />
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
            disabled={loading}
            className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? t(`${af}.saving`) : item ? t(`${af}.save`) : t(`${af}.add`)}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
