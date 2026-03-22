"use client";

import { Search } from "lucide-react";

export function DashboardListSearch({
  value,
  onChange,
  placeholder = "بحث في البيانات المعروضة…",
  id = "dashboard-data-search",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  id?: string;
}) {
  return (
    <div className="mb-5 md:mb-6">
      <label htmlFor={id} className="sr-only">
        بحث
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          id={id}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-xl border border-border bg-card py-3 pl-4 pr-11 text-base shadow-sm outline-none ring-primary/20 transition-[box-shadow] placeholder:text-muted-foreground focus-visible:ring-2"
        />
      </div>
    </div>
  );
}
