"use client";

export function InvoicePrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
    >
      {label}
    </button>
  );
}

