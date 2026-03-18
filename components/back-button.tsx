"use client";

import { useRouter } from "next/navigation";

export function BackButton({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={
        className ??
        "inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-foreground hover:bg-gray-50 hover:border-gray-300 transition-colors"
      }
    >
      <span aria-hidden className="text-lg leading-none">
        ‹
      </span>
      رجوع
    </button>
  );
}

