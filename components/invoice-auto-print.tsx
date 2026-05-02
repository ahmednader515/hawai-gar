"use client";

import { useEffect } from "react";

export function InvoiceAutoPrint({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    const timer = window.setTimeout(() => {
      window.print();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [enabled]);

  return null;
}

