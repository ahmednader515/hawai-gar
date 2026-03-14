"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RequestActions({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState<"accept" | "refuse" | null>(null);
  const router = useRouter();

  async function respond(accept: boolean) {
    setLoading(accept ? "accept" : "refuse");
    try {
      const res = await fetch(`/api/orders/${orderId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        onClick={() => respond(true)}
        disabled={!!loading}
      >
        {loading === "accept" ? "جاري..." : "قبول"}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => respond(false)}
        disabled={!!loading}
      >
        {loading === "refuse" ? "جاري..." : "رفض"}
      </Button>
    </div>
  );
}
