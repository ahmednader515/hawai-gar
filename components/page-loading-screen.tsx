"use client";

import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { TruckIcon, type TruckIconHandle } from "@/components/truck-icon";
import type { TruckRunSpec } from "@/lib/route-loading-types";

type PageLoadingScreenProps = {
  truckRun: TruckRunSpec | null;
  onTruckComplete: () => void;
};

/** Physical left → right on screen */
const START_LEFT = "12%";
const END_LEFT = "88%";

/**
 * SVG viewBox 24×24: wheels end ~y=20; padding below wheels to y=24 — shift icon down so
 * tires sit on the dashed road (not floating above it).
 */
const WHEEL_ON_LINE_SHIFT = "translate-y-[9px] sm:translate-y-[10px]";

/**
 * Full-route loading UI: animated TruckIcon (your motion SVG) on a dashed line.
 * Internal wheel + speed-line animation runs for the whole overlay; horizontal move when route is ready.
 */
export function PageLoadingScreen({ truckRun, onTruckComplete }: PageLoadingScreenProps) {
  const { t } = useI18n();
  const truckRef = useRef<TruckIconHandle>(null);
  const completedRef = useRef(false);

  /** Wheels + speed lines (motion SVG) for the whole overlay */
  useEffect(() => {
    truckRef.current?.startAnimation();
    return () => truckRef.current?.stopAnimation();
  }, []);

  useEffect(() => {
    completedRef.current = false;
  }, [truckRun?.id]);

  const handleAnimationComplete = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onTruckComplete();
  };

  const durationSec = truckRun ? truckRun.durationMs / 1000 : 0;

  return (
    <div
      className="fixed inset-0 z-[200] flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-background/85 backdrop-blur-md"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative mx-auto w-[min(18rem,85vw)] px-2">
        {/* Road: line at bottom; truck anchored to bottom so wheels meet the road */}
        <div className="relative h-[3.25rem] sm:h-[3.5rem]">
          <div
            className="absolute bottom-0 left-3 right-3 border-b-2 border-dashed border-primary/50 sm:left-4 sm:right-4"
            aria-hidden
          />
          <div
            className="absolute bottom-0 left-3 right-3 border-b border-primary/20 sm:left-4 sm:right-4"
            aria-hidden
          />

          {/* One TruckIcon (motion SVG); do not key-remount or ref loses animation */}
          <motion.div
            className={`absolute bottom-0 left-0 text-primary ${WHEEL_ON_LINE_SHIFT}`}
            initial={{ left: START_LEFT }}
            animate={
              truckRun ? { left: END_LEFT } : { left: START_LEFT }
            }
            transition={
              truckRun
                ? {
                    duration: Math.max(durationSec, 0.05),
                    ease: "linear",
                  }
                : { duration: 0 }
            }
            onAnimationComplete={truckRun ? handleAnimationComplete : undefined}
          >
            <div className="-translate-x-1/2">
              <TruckIcon
                ref={truckRef}
                size={44}
                className="drop-shadow-md [&_svg]:block [&_svg]:max-w-none [&_path]:stroke-current [&_circle]:stroke-current [&_line]:stroke-current"
                aria-hidden
              />
            </div>
          </motion.div>
        </div>
      </div>
      <p className="text-sm font-medium text-muted-foreground sm:text-base">{t("common.loading")}</p>
    </div>
  );
}
