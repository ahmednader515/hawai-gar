"use client";

import { BackButton } from "@/components/back-button";
import { LanguageSwitcher } from "@/components/language-switcher";

export function LoginToolbar() {
  return (
    <div className="absolute top-4 inset-x-4 flex justify-between items-start gap-3 z-10 max-w-full">
      <BackButton />
      <LanguageSwitcher variant="subtle" className="shrink-0" />
    </div>
  );
}
