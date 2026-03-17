"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ShipmentRequestAdminActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(decision: "approve" | "reject") {
    setLoading(decision);
    setError(null);
    try {
      const res = await fetch(`/api/admin/shipment-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "تعذر تنفيذ العملية");
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  const canDecide = status === "CARRIER_ACCEPTED" || status === "CARRIER_REFUSED";
  const isPendingCarrier = status === "PENDING_CARRIER";
  const isFinal = status === "ADMIN_APPROVED" || status === "ADMIN_REJECTED";

  return (
    <div className="pt-2 space-y-2">
      {error && (
        <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {isPendingCarrier && (
        <p className="text-xs text-muted-foreground">
          بانتظار قرار شركة النقل أولاً.
        </p>
      )}
      {isFinal && (
        <p className="text-xs text-muted-foreground">
          تم اتخاذ قرار الأدمن بالفعل.
        </p>
      )}
      <div className="flex gap-2">
        <Button size="sm" onClick={() => send("approve")} disabled={!canDecide || !!loading}>
          {loading === "approve" ? "جاري..." : "موافقة"}
        </Button>
        <Button size="sm" variant="destructive" onClick={() => send("reject")} disabled={!canDecide || !!loading}>
          {loading === "reject" ? "جاري..." : "رفض"}
        </Button>
      </div>
    </div>
  );
}

