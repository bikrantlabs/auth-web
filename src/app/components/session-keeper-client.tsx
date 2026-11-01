"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const REFRESH_LEEWAY_MS = 60_000;
const MIN_DELAY_MS = 1_000;
const RETRY_DELAY_MS = 30_000;
// Used when the access token is not a readable JWT. Matches the cookie's
// lifetime, so we refresh on the same cadence the browser uses to drop it.
const FALLBACK_INTERVAL_MS = 13 * 60_000;

const LOCK_NAME = "session-refresh";

type Props = {
  needsRefresh: boolean;
  expiresAt: number | null;
};

/**
 * Invisible timer that keeps the session alive.
 *
 * It calls our own route handler, which sets fresh cookies on the browser's
 * response. The browser is the only place that can coordinate this: every tab
 * shares one cookie jar, and `navigator.locks` makes sure only one refresh
 * runs at a time. That is what stops the parallel-request race.
 */
export function SessionKeeperClient({ needsRefresh, expiresAt }: Props) {
  const router = useRouter();
  const lastRefreshAt = useRef(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const schedule = (delayMs: number) => {
      if (cancelled) return;
      clearTimeout(timer);
      timer = setTimeout(() => void refresh(), Math.max(delayMs, MIN_DELAY_MS));
    };

    const runRefresh = async () => {
      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
        });

        if (cancelled) return;

        // The session is genuinely over. Re-render and let the proxy send the
        // user to the login page.
        if (res.status === 401) {
          router.refresh();
          return;
        }

        // API hiccup: keep the session and try again shortly.
        if (!res.ok) {
          schedule(RETRY_DELAY_MS);
          return;
        }

        lastRefreshAt.current = Date.now();

        // New cookies are already in the browser. Re-render the server tree so
        // it picks them up, and so this component receives a fresh expiry.
        router.refresh();
      } catch {
        schedule(RETRY_DELAY_MS);
      }
    };

    const refresh = async () => {
      if (cancelled) return;

      // One refresh at a time across every open tab.
      if (typeof navigator !== "undefined" && "locks" in navigator) {
        await navigator.locks.request(LOCK_NAME, runRefresh);
      } else {
        await runRefresh();
      }
    };

    // True when the token is (about to be) too old to use.
    const isDue = () => {
      if (expiresAt !== null) {
        return Date.now() >= expiresAt - REFRESH_LEEWAY_MS;
      }
      // Unknown expiry: fall back to a time since the last refresh.
      return Date.now() - lastRefreshAt.current >= FALLBACK_INTERVAL_MS;
    };

    if (needsRefresh) {
      // Access token already gone: refresh as soon as we are mounted.
      schedule(0);
    } else if (expiresAt === null) {
      schedule(FALLBACK_INTERVAL_MS);
    } else {
      const delay = expiresAt - Date.now() - REFRESH_LEEWAY_MS;
      // A negative delay means the server and the browser disagree about the
      // clock. Wait a beat instead of hammering the endpoint.
      schedule(delay > 0 ? delay : RETRY_DELAY_MS);
    }

    const onVisible = () => {
      if (document.visibilityState === "visible" && isDue()) {
        void refresh();
      }
    };

    const onOnline = () => {
      if (isDue()) void refresh();
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
    };
  }, [needsRefresh, expiresAt, router]);

  return null;
}
