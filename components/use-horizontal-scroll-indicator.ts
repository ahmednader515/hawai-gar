"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useHorizontalScrollIndicator() {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const update = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) {
      setShowLeft(false);
      setShowRight(false);
      return;
    }
    const content = el.firstElementChild as HTMLElement | null;
    if (!content) {
      setShowLeft(false);
      setShowRight(false);
      return;
    }
    const scrollerRect = el.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    const threshold = 6;
    const hiddenOnLeft = contentRect.left < scrollerRect.left - threshold;
    const hiddenOnRight = contentRect.right > scrollerRect.right + threshold;
    // In our RTL bottom bars, indicator sides are visually reversed.
    setShowLeft(hiddenOnRight);
    setShowRight(hiddenOnLeft);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(update);
    const onResize = () => update();
    window.addEventListener("resize", onResize);
    const timer = window.setTimeout(update, 80);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(timer);
    };
  }, [update]);

  return { scrollerRef, showLeft, showRight, update };
}

