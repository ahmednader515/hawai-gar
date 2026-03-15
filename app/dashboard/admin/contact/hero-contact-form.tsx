"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { HeroContactInfo } from "@/lib/site-settings";

export function HeroContactForm({ initial }: { initial: HeroContactInfo }) {
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
        setMessage({ type: "error", text: data.error ?? "فشل الحفظ" });
        return;
      }
      setMessage({ type: "success", text: "تم حفظ معلومات التواصل." });
    } catch {
      setMessage({ type: "error", text: "حدث خطأ أثناء الحفظ" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-xl">
      <div className="space-y-2">
        <Label htmlFor="hero-email">البريد الإلكتروني (تبويب «تواصل معنا» في الهيرو)</Label>
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
        <Label htmlFor="hero-phone">رقم الهاتف (اختياري)</Label>
        <Input
          id="hero-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+966 ..."
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
      <Button type="submit" disabled={saving} className="bg-amber-500 hover:bg-amber-600">
        {saving ? "جاري الحفظ..." : "حفظ"}
      </Button>
    </form>
  );
}
