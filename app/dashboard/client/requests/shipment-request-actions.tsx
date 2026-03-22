"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/providers/i18n-provider";

export function ShipmentRequestActions({ id, status }: { id: string; status: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState<"accept" | "refuse" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canDecide = status === "PENDING_CARRIER";

  async function send(decision: "accept" | "refuse") {
    setLoading(decision);
    setError(null);
    try {
      const res = await fetch(`/api/shipment-requests/${id}/carrier-decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? t("dashboard.client.carrierActionError"));
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="pt-2 space-y-2">
      {error && (
        <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => send("accept")}
          disabled={!canDecide || !!loading}
        >
          {loading === "accept" ? t("dashboard.client.working") : t("dashboard.client.accept")}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => send("refuse")}
          disabled={!canDecide || !!loading}
        >
          {loading === "refuse" ? t("dashboard.client.working") : t("dashboard.client.refuse")}
        </Button>
      </div>
    </div>
  );
}
