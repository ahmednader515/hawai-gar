"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { NewsItem } from "@prisma/client";

export function NewsItemForm({ item }: { item?: NewsItem }) {
  const router = useRouter();
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
      imageUrl: formData.get("imageUrl") as string,
      excerpt: (formData.get("excerpt") as string) || null,
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
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  const defaultDate = item
    ? new Date(item.publishedAt).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div>
            <Label htmlFor="titleAr">العنوان (عربي) *</Label>
            <Input
              id="titleAr"
              name="titleAr"
              defaultValue={item?.titleAr}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="titleEn">العنوان (إنجليزي)</Label>
            <Input
              id="titleEn"
              name="titleEn"
              defaultValue={item?.titleEn ?? ""}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="category">التصنيف *</Label>
            <Input
              id="category"
              name="category"
              defaultValue={item?.category}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="imageUrl">رابط الصورة *</Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              defaultValue={item?.imageUrl}
              required
              placeholder="/land-shipping-1.png"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="excerpt">ملخص</Label>
            <Input
              id="excerpt"
              name="excerpt"
              defaultValue={item?.excerpt ?? ""}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="link">رابط القراءة</Label>
            <Input
              id="link"
              name="link"
              defaultValue={item?.link ?? ""}
              placeholder="#"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="publishedAt">تاريخ النشر *</Label>
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
            {loading ? "جاري الحفظ..." : item ? "حفظ التعديلات" : "إضافة"}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
