"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const A = "dashboard.admin";

type Props = {
  variant: "belowPrice" | "standalone";
  invoiceLinkInput: string;
  onInvoiceLinkChange: (value: string) => void;
  invoiceLinkProp: string | null;
  loadingInvoice: boolean;
  onSave: () => void;
  onClear: () => void;
  t: (key: string) => string;
};

/** Module-level component so typing in the URL input does not remount on each parent render (focus loss). */
export function AdminInvoiceLinkFields({
  variant,
  invoiceLinkInput,
  onInvoiceLinkChange,
  invoiceLinkProp,
  loadingInvoice,
  onSave,
  onClear,
  t,
}: Props) {
  const fieldId = variant === "belowPrice" ? "admin-invoice-link-inline" : "admin-invoice-link";

  return (
    <div
      className={cn(
        "space-y-3",
        variant === "belowPrice" && "border-t border-border/60 pt-3",
      )}
    >
      <div>
        <p className="text-sm font-medium">{t(`${A}.shipmentActionsInvoiceTitle`)}</p>
        <p className="text-xs text-muted-foreground mt-1">{t(`${A}.shipmentActionsInvoiceHint`)}</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={fieldId}>{t(`${A}.shipmentActionsInvoiceFieldLabel`)}</Label>
        <Input
          id={fieldId}
          type="url"
          inputMode="url"
          autoComplete="off"
          placeholder={t(`${A}.shipmentActionsInvoicePlaceholder`)}
          value={invoiceLinkInput}
          onChange={(e) => onInvoiceLinkChange(e.target.value)}
          disabled={loadingInvoice}
          dir="ltr"
          className="font-mono text-sm"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          type="button"
          onClick={() => void onSave()}
          disabled={loadingInvoice || !invoiceLinkInput.trim()}
        >
          {loadingInvoice ? t(`${A}.shipmentActionsInvoiceSaving`) : t(`${A}.shipmentActionsInvoiceSave`)}
        </Button>
        {(invoiceLinkProp ?? "").length > 0 && (
          <Button size="sm" type="button" variant="outline" onClick={() => void onClear()} disabled={loadingInvoice}>
            {t(`${A}.shipmentActionsInvoiceClear`)}
          </Button>
        )}
      </div>
    </div>
  );
}
