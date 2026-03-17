"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MapPin, User, ArrowLeftRight, Loader2 } from "lucide-react";

type Location = { id: string; nameAr: string };
type Driver = { id: string; name: string | null; carPlate: string | null; carType: string | null };

export function NewOrderForm() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const refreshDrivers = async (from: string, to: string) => {
    if (!from || !to) return;
    setLoadingDrivers(true);
    setDriverId("");
    try {
      const res = await fetch(`/api/drivers/available?from=${from}&to=${to}`);
      const data = await res.json();
      if (data?.error) {
        setError(String(data.error));
        setDrivers([]);
      } else {
        setDrivers(Array.isArray(data) ? data : []);
        setError("");
      }
    } catch {
      setDrivers([]);
    } finally {
      setLoadingDrivers(false);
    }
  };

  useEffect(() => {
    fetch("/api/locations")
      .then((r) => r.json())
      .then((data) => {
        setLocations(data);
        setLoadingLocations(false);
      })
      .catch(() => setLoadingLocations(false));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fromId || !toId || !driverId) {
      setError("يرجى اختيار نقطة الانطلاق والوصول وشركة النقل");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromLocationId: fromId,
          toLocationId: toId,
          driverId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "فشل إنشاء الطلب");
        setSubmitting(false);
        return;
      }
      router.push("/dashboard/company/orders");
      router.refresh();
    } catch {
      setError("حدث خطأ");
      setSubmitting(false);
    }
  }

  if (loadingLocations) {
    return (
      <Card className="max-w-2xl border border-border">
        <CardContent className="py-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" aria-hidden />
          <p className="text-muted-foreground">جاري تحميل المواقع...</p>
        </CardContent>
      </Card>
    );
  }

  const selectedDriverLabel = driverId
    ? (() => {
        const d = drivers.find((x) => x.id === driverId);
        if (!d) return null;
        const parts = [d.name ?? "—", d.carPlate ?? "—"];
        if (d.carType) parts.push(d.carType);
        return parts.join(" — ");
      })()
    : null;

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-2xl">
      {/* Route section */}
      <Card className="border border-border overflow-hidden">
        <CardHeader className="pb-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <MapPin className="w-4 h-4" aria-hidden />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">تفاصيل الرحلة</h2>
              <p className="text-xs text-muted-foreground">نقطة الانطلاق والوصول</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-foreground">من (نقطة الانطلاق)</Label>
              <Select
                value={fromId}
                onValueChange={(v) => {
                  const nextFrom = v ?? "";
                  setFromId(nextFrom);
                  setDrivers([]);
                  setDriverId("");
                  setError("");
                  setLoadingDrivers(false);
                  if (nextFrom && toId) refreshDrivers(nextFrom, toId);
                }}
                required
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="اختر الموقع">
                    {fromId ? locations.find((l) => l.id === fromId)?.nameAr : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.nameAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">إلى (نقطة الوصول)</Label>
              <Select
                value={toId}
                onValueChange={(v) => {
                  const nextTo = v ?? "";
                  setToId(nextTo);
                  setDrivers([]);
                  setDriverId("");
                  setError("");
                  setLoadingDrivers(false);
                  if (fromId && nextTo) refreshDrivers(fromId, nextTo);
                }}
                required
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="اختر الموقع">
                    {toId ? locations.find((l) => l.id === toId)?.nameAr : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.nameAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {fromId && toId && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowLeftRight className="w-4 h-4 shrink-0" aria-hidden />
              <span>
                {locations.find((l) => l.id === fromId)?.nameAr} →{" "}
                {locations.find((l) => l.id === toId)?.nameAr}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Driver section */}
      {fromId && toId && (
        <Card className="border border-border overflow-hidden">
          <CardHeader className="pb-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <User className="w-4 h-4" aria-hidden />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">اختيار شركة النقل</h2>
                <p className="text-xs text-muted-foreground">شركات النقل المتاحة لهذه الرحلة</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label className="text-foreground">شركة النقل</Label>
              {loadingDrivers ? (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-8 justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" aria-hidden />
                  <p className="text-sm text-muted-foreground">جاري تحميل شركات النقل...</p>
                </div>
              ) : drivers.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
                  <p className="text-sm text-muted-foreground">لا يوجد شركات نقل متاحة لهذه الرحلة</p>
                  <p className="text-xs text-muted-foreground mt-1">جرّب تغيير نقطة الانطلاق أو الوصول</p>
                </div>
              ) : (
                <Select value={driverId} onValueChange={(v) => setDriverId(v ?? "")} required>
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="اختر شركة النقل">
                      {selectedDriverLabel}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        <span className="flex items-center gap-2">
                          <span className="font-medium">{d.name ?? "—"}</span>
                          <span className="text-muted-foreground">
                            {d.carPlate ?? "—"}
                            {d.carType ? ` · ${d.carType}` : ""}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-4">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => router.push("/dashboard/company/orders")}
        >
          إلغاء
        </Button>
        <Button
          type="submit"
          disabled={submitting || !fromId || !toId || !driverId}
          className="w-full sm:w-auto min-w-[140px]"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin me-2" aria-hidden />
              جاري الإرسال...
            </>
          ) : (
            "إنشاء الطلب"
          )}
        </Button>
      </div>
    </form>
  );
}
