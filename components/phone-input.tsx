"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  DEFAULT_PHONE_COUNTRY_ISO,
  PHONE_COUNTRIES,
  findCountryByIso,
  isValidNationalDigits,
  normalizeNationalDigits,
  parsePhoneValue,
  toE164,
  type PhoneCountry,
  digitsOnly,
} from "@/lib/phone";

function FlagImg({ iso, size = 16 }: { iso: string; size?: number }) {
  const code = String(iso ?? "").trim().toLowerCase();
  const src = code && code.length === 2 ? `https://flagcdn.com/w20/${code}.png` : "";
  // Use a real image because some OSes render flag emojis as "EG", "SA", etc.
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      width={size}
      height={Math.round((size * 3) / 4)}
      className="inline-block shrink-0 rounded-[2px] ring-1 ring-foreground/10"
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
    />
  );
}

export function PhoneInput({
  id,
  name,
  value,
  onChange,
  disabled,
  required,
  defaultCountryIso = DEFAULT_PHONE_COUNTRY_ISO,
  locale = "ar",
  className,
  selectClassName,
  inputClassName,
  placeholder,
}: {
  id?: string;
  name?: string;
  value: string;
  onChange: (e164Value: string) => void;
  disabled?: boolean;
  required?: boolean;
  defaultCountryIso?: string;
  locale?: "ar" | "en" | string;
  className?: string;
  selectClassName?: string;
  inputClassName?: string;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isArabic = locale === "ar";

  const [countryIso, setCountryIso] = useState<string>(() => {
    const parsed = parsePhoneValue(value, { defaultIso: defaultCountryIso });
    return parsed.country.iso;
  });
  const [nationalDigits, setNationalDigits] = useState<string>(() => {
    const parsed = parsePhoneValue(value, { defaultIso: defaultCountryIso });
    return digitsOnly(parsed.nationalDigits);
  });

  const country: PhoneCountry =
    findCountryByIso(countryIso) ?? findCountryByIso(defaultCountryIso) ?? PHONE_COUNTRIES[0]!;

  // Keep internal state in sync if parent value changes (e.g., reset form).
  useEffect(() => {
    const parsed = parsePhoneValue(value, { defaultIso: defaultCountryIso });
    setCountryIso(parsed.country.iso);
    setNationalDigits(digitsOnly(parsed.nationalDigits));
  }, [value, defaultCountryIso]);

  const min = country.minDigits;
  const max = country.maxDigits;
  const normalizedDigits = useMemo(
    () => normalizeNationalDigits(country, nationalDigits),
    [country, nationalDigits]
  );
  const validLen = isValidNationalDigits(country, normalizedDigits);
  const uiMaxLen = max + 1; // allow users to type a leading trunk "0" (e.g. 05..., 010...)

  const helperText = useMemo(() => {
    if (!nationalDigits) return isArabic ? `مثال: ${country.minDigits} أرقام` : `Example: ${country.minDigits} digits`;
    if (validLen) return null;
    const range = min === max ? `${min}` : `${min}-${max}`;
    return isArabic ? `يجب أن يكون الرقم ${range} أرقام` : `Must be ${range} digits`;
  }, [country.minDigits, isArabic, max, min, nationalDigits, validLen]);

  const emit = (c: PhoneCountry, d: string) => {
    const normalized = normalizeNationalDigits(c, d);
    onChange(toE164(c, normalized));
  };

  const setCustomValidity = (msg: string) => {
    const el = inputRef.current;
    if (!el) return;
    el.setCustomValidity(msg);
  };

  useEffect(() => {
    // Clear custom validity while typing; enforce again on blur.
    setCustomValidity("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryIso, nationalDigits]);

  return (
    <div className={cn("space-y-1.5", className)}>
      {/* Force LTR so selector stays on the left even in RTL pages */}
      <div className="flex gap-2" dir="ltr">
        <Select
          value={countryIso}
          onValueChange={(iso) => {
            if (!iso) return;
            setCountryIso(iso);
            const nextCountry = findCountryByIso(iso) ?? country;
            const nextDigits = digitsOnly(nationalDigits).slice(0, nextCountry.maxDigits);
            setNationalDigits(nextDigits);
            emit(nextCountry, nextDigits);
          }}
          disabled={disabled}
        >
          <SelectTrigger
            className={cn(
              "h-11 min-h-11 w-[5.75rem] justify-center gap-1 px-2 py-0 leading-none tabular-nums",
              selectClassName
            )}
          >
            {/* Base UI SelectValue renders the selected item's text; keep it for a11y but hide it. */}
            <SelectValue className="sr-only" />
            <span
              className="inline-flex items-center gap-1.5"
              aria-label={`${country.iso} +${country.dialCode}`}
            >
              <FlagImg iso={country.iso} />
              <span dir="ltr" className="text-sm">
                +{country.dialCode}
              </span>
            </span>
          </SelectTrigger>
          <SelectContent align="start" className="w-auto min-w-[16rem]">
            <SelectGroup>
              {PHONE_COUNTRIES.map((c) => (
                <SelectItem key={c.iso} value={c.iso}>
                  <span className="inline-flex items-center gap-2 tabular-nums">
                    <FlagImg iso={c.iso} />
                    <span dir="ltr">+{c.dialCode}</span>
                    <span className="text-muted-foreground text-xs">
                      {isArabic ? c.nameAr : c.nameEn}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Input
          ref={inputRef}
          id={id}
          name={name}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          dir="ltr"
          value={nationalDigits}
          onChange={(e) => {
            const d = digitsOnly(e.target.value).slice(0, uiMaxLen);
            setNationalDigits(d);
            emit(country, d);
          }}
          onBlur={() => {
            if (!required && !nationalDigits) {
              setCustomValidity("");
              return;
            }
            if (!nationalDigits) {
              setCustomValidity(isArabic ? "رقم الهاتف مطلوب" : "Phone number is required");
              return;
            }
            const normalized = normalizeNationalDigits(country, nationalDigits);
            if (!isValidNationalDigits(country, normalized)) {
              const range = min === max ? `${min}` : `${min}-${max}`;
              setCustomValidity(isArabic ? `يجب أن يكون الرقم ${range} أرقام` : `Must be ${range} digits`);
              return;
            }
            setCustomValidity("");
          }}
          required={required}
          disabled={disabled}
          minLength={min}
          maxLength={uiMaxLen}
          placeholder={
            placeholder ??
            country.placeholderNational ??
            (isArabic ? "أدخل رقم الهاتف" : "Enter phone number")
          }
          aria-invalid={nationalDigits.length > 0 && !validLen}
          className={cn("h-11", inputClassName)}
        />
      </div>

      {helperText ? (
        <p className={cn("text-xs text-muted-foreground", nationalDigits && !validLen ? "text-destructive" : "")}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

