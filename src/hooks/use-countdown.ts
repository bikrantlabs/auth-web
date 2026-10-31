"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Countdown based on an absolute deadline, so it stays accurate when the tab
 * is inactive and timers are throttled.
 */
export function useCountdown() {
  const [deadline, setDeadline] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const start = useCallback((durationMs: number) => {
    if (durationMs <= 0) {
      setDeadline(null);
      setRemainingSeconds(0);
      return;
    }

    setDeadline(Date.now() + durationMs);
  }, []);

  const stop = useCallback(() => {
    setDeadline(null);
    setRemainingSeconds(0);
  }, []);

  useEffect(() => {
    if (deadline === null) return;

    const tick = () => {
      const remainingMs = deadline - Date.now();

      if (remainingMs <= 0) {
        setRemainingSeconds(0);
        setDeadline(null);
        return;
      }

      setRemainingSeconds(Math.ceil(remainingMs / 1000));
    };

    tick();
    const intervalId = window.setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [deadline]);

  return {
    remainingSeconds,
    isActive: remainingSeconds > 0,
    start,
    stop,
  };
}
