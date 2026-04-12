"use client";

import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/providers/i18n-provider";
import type { CarrierAckVariant } from "@/lib/carrier-ack-variant";

/** Per-user optimistic UI after POST (before refresh). Must not leak across accounts on the same browser. */
const CARRIER_DECISION_SENT_BY_USER_KEY = "clientCarrierDecisionSentByUser";

function readCarrierDecisionSentIds(userId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CARRIER_DECISION_SENT_BY_USER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return [];
    const row = (parsed as Record<string, unknown>)[userId];
    return Array.isArray(row) ? row.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function rememberCarrierDecisionSent(userId: string, id: string) {
  try {
    const raw = localStorage.getItem(CARRIER_DECISION_SENT_BY_USER_KEY);
    let map: Record<string, string[]> = {};
    try {
      if (raw) {
        const p = JSON.parse(raw) as unknown;
        if (p && typeof p === "object" && !Array.isArray(p)) {
          map = { ...(p as Record<string, string[]>) };
        }
      }
    } catch {
      map = {};
    }
    const ids = new Set(map[userId] ?? []);
    ids.add(id);
    map[userId] = [...ids];
    localStorage.setItem(CARRIER_DECISION_SENT_BY_USER_KEY, JSON.stringify(map));
  } catch {
    /* quota / private mode */
  }
}

export function ShipmentRequestActions({
  id,
  status,
  carrierAckVariant,
  carrierId,
  currentUserId,
}: {
  id: string;
  status: string;
  /** From server: self decision vs admin-assigned carrier vs none. */
  carrierAckVariant: CarrierAckVariant;
  /** When set to another platform user, this viewer must not see accept/banner as “their” action. */
  carrierId: string | null;
  currentUserId: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState<"accept" | "refuse" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ackFromStorage, setAckFromStorage] = useState(false);

  const assignedToAnotherCarrier =
    carrierId != null && carrierId !== currentUserId;

  const canDecide = status === "PENDING_CARRIER";

  useEffect(() => {
    if (assignedToAnotherCarrier) {
      setAckFromStorage(false);
      return;
    }
    if (readCarrierDecisionSentIds(currentUserId).includes(id)) {
      setAckFromStorage(true);
    }
  }, [id, currentUserId, assignedToAnotherCarrier]);

  const showAckBanner =
    !assignedToAnotherCarrier &&
    (carrierAckVariant !== "none" || ackFromStorage);

  if (assignedToAnotherCarrier) {
    return null;
  }

  const bannerText =
    carrierAckVariant === "admin"
      ? t("dashboard.client.carrierSelectedByAdmin")
      : t("dashboard.client.carrierDecisionSent");

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
      rememberCarrierDecisionSent(currentUserId, id);
      flushSync(() => {
        setAckFromStorage(true);
      });
      setTimeout(() => {
        router.refresh();
      }, 0);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="pt-2 space-y-2">
      {showAckBanner ? (
        <p
          className="text-sm text-green-800 bg-green-50 rounded-lg px-3 py-2"
          role="status"
          aria-live="polite"
        >
          {bannerText}
        </p>
      ) : null}
      {error && (
        <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {(canDecide || error) ? (
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
      ) : null}
    </div>
  );
}
