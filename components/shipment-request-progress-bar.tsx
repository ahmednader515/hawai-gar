"use client";

import { useEffect, useMemo, useRef } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { TruckIcon, type TruckIconHandle } from "@/components/truck-icon";
import {
  getShipmentRequestProgressPercent,
  isShipmentRequestRejected,
} from "@/lib/shipment-request-progress";
import { cn } from "@/lib/utils";

const P = "dashboard.admin";

const STEP_THRESHOLDS = [12, 32, 56, 78, 100] as const;

type Props = {
  status: string;
  className?: string;
};

export function ShipmentRequestProgressBar({ status, className }: Props) {
  const { t, locale } = useI18n();
  const truckRef = useRef<TruckIconHandle>(null);
  const percent = useMemo(() => getShipmentRequestProgressPercent(status), [status]);
  const rejected = isShipmentRequestRejected(status);
  const rtl = locale === "ar";

  useEffect(() => {
    truckRef.current?.startAnimation();
    return () => truckRef.current?.stopAnimation();
  }, []);

  const steps = useMemo(
    () => [
      t(`${P}.shipmentProgressStepCarrier`),
      t(`${P}.shipmentProgressStepAdmin`),
      t(`${P}.shipmentProgressStepPrice`),
      t(`${P}.shipmentProgressStepPayment`),
      t(`${P}.shipmentProgressStepComplete`),
    ],
    [t],
  );

  return (
    <div
      className={cn(
        "rounded-2xl border border-primary/15 bg-gradient-to-b from-primary/[0.07] to-muted/30 px-4 py-4 shadow-sm ring-1 ring-primary/10 sm:px-5 sm:py-5",
        className,
      )}
      role="group"
    >
      <div className="sr-only" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
        {t(`${P}.shipmentProgressAriaLabel`)}: {percent}%
      </div>
      {rejected ? (
        <p className="mb-3 text-center text-xs font-medium text-red-700 dark:text-red-300">
          {t(`${P}.shipmentProgressRejectedHint`)}
        </p>
      ) : null}

      <div className="relative pb-10 pt-1">
        <div
          className={cn(
            "relative h-3.5 w-full overflow-visible rounded-full border border-border/60 bg-muted/80 shadow-inner",
            rejected && "border-red-200/80 bg-red-50/50 dark:border-red-900/40",
          )}
          aria-hidden
        >
          {/* Fill: grows from right in RTL, from left in LTR */}
          <div
            className={cn(
              "absolute inset-y-0 rounded-full bg-gradient-to-r from-primary to-primary/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-[width] duration-700 ease-out",
              rtl ? "right-0" : "left-0",
              rejected && "from-red-500 to-red-600",
            )}
            style={{ width: `${percent}%` }}
          />
          <div className="pointer-events-none absolute inset-x-3 top-1/2 h-0 border-t border-dashed border-white/70 shadow-[0_0_1px_rgba(0,0,0,0.15)]" />
        </div>

        {/* Truck at the “front” of the fill (toward completion) */}
        <div
          className="pointer-events-none absolute top-0 z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-primary bg-background text-primary shadow-lg ring-2 ring-primary/20 transition-all duration-700 ease-out dark:bg-card"
          style={
            rtl
              ? {
                  left: `clamp(1.125rem, calc(100% - ${percent}%), calc(100% - 1.125rem))`,
                  right: "auto",
                }
              : {
                  left: `clamp(1.125rem, ${percent}%, calc(100% - 1.125rem))`,
                  right: "auto",
                }
          }
        >
          <div className={cn("flex items-center justify-center", rtl && "-scale-x-100")}>
            <TruckIcon
              ref={truckRef}
              size={22}
              className="text-primary [&_svg]:block [&_svg]:max-w-none [&_path]:stroke-current [&_circle]:stroke-current [&_line]:stroke-current"
              aria-hidden
            />
          </div>
        </div>

        <ul
          className={cn(
            "mt-4 grid grid-cols-5 gap-1 text-[0.65rem] font-medium leading-tight text-muted-foreground sm:text-xs",
          )}
          dir={rtl ? "rtl" : "ltr"}
        >
          {steps.map((label, i) => {
            const threshold = STEP_THRESHOLDS[i];
            const active = !rejected && percent >= threshold;
            return (
              <li
                key={i}
                className={cn(
                  "text-center transition-colors",
                  active && "font-semibold text-primary",
                  rejected && i <= 1 && "text-foreground/70",
                )}
              >
                <span className="line-clamp-3 sm:line-clamp-none">{label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
