"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusOptionsAfterApproval = [
  { value: "ACCEPTED", label: "مقبول" },
  { value: "IN_PROGRESS", label: "قيد التنفيذ" },
  { value: "DONE", label: "منتهي" },
  { value: "CANCELLED", label: "ملغى" },
];

export function OrderAdminActions({
  orderId,
  status,
  redirectAfterDelete = "/dashboard/admin",
}: {
  orderId: string;
  status: string;
  redirectAfterDelete?: string;
}) {
  const [newStatus, setNewStatus] = useState(status);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const isPendingApproval = status === "PENDING_APPROVAL";

  async function setStatus(value: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: value }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  async function deleteOrder() {
    if (!confirm("هل تريد حذف هذا الطلب؟")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      if (res.ok) {
        router.push(redirectAfterDelete);
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  const canDelete = status === "DONE" || status === "CANCELLED" || status === "REFUSED";

  if (isPendingApproval) {
    return (
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-sm text-muted-foreground">راجع التفاصيل ثم قرّر قبول أو رفض الطلب.</p>
        <Button
          size="sm"
          onClick={() => setStatus("ACCEPTED")}
          disabled={loading}
        >
          {loading ? "جاري..." : "قبول الطلب"}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => setStatus("REFUSED")}
          disabled={loading}
        >
          {loading ? "جاري..." : "رفض الطلب"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <Select value={newStatus} onValueChange={(v) => setNewStatus(v ?? status)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptionsAfterApproval.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          onClick={() => setStatus(newStatus)}
          disabled={loading || newStatus === status}
        >
          {loading ? "جاري..." : "تحديث الحالة"}
        </Button>
      </div>
      {canDelete && (
        <Button
          size="sm"
          variant="destructive"
          onClick={deleteOrder}
          disabled={deleting}
        >
          {deleting ? "جاري الحذف..." : "حذف الطلب"}
        </Button>
      )}
    </div>
  );
}
