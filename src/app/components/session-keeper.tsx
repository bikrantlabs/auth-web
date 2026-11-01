import { Suspense } from "react";

import { getSessionState } from "@/lib/auth";

import { SessionKeeperClient } from "./session-keeper-client";

/**
 * Server half of the session keeper. Reads the session behind a Suspense
 * boundary so the rest of the shell can still be prerendered, then hands the
 * timing to the client.
 */
export function SessionKeeper() {
  return (
    <Suspense fallback={null}>
      <SessionKeeperBoundary />
    </Suspense>
  );
}

async function SessionKeeperBoundary() {
  const session = await getSessionState();

  if (!session.hasSession) return null;

  return (
    <SessionKeeperClient
      needsRefresh={session.needsRefresh}
      expiresAt={session.accessTokenExpiresAt}
    />
  );
}
