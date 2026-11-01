import { cookies } from "next/headers";
import { connection } from "next/server";

import type { User } from "@/lib/api/response";
import {
  ACCESS_TOKEN_COOKIE_KEY,
  REFRESH_TOKEN_COOKIE_KEY,
  USER_COOKIE_KEY,
} from "@/lib/cookie-config";

export async function auth(): Promise<User | null> {
  const jar = await cookies();
  const userCookie = jar.get(USER_COOKIE_KEY)?.value;
  if (!userCookie) return null;

  try {
    return JSON.parse(userCookie) as User;
  } catch {
    return null;
  }
}

export type SessionState = {
  /** A refresh token exists, so the session is still alive. */
  hasSession: boolean;
  /** Access token expiry in ms epoch, or null when missing/unreadable. */
  accessTokenExpiresAt: number | null;
  /** The access token is gone or already past its exp. */
  needsRefresh: boolean;
};

/**
 * What the session keeper needs to know: whether a session exists at all, and
 * when the access token runs out.
 */
export async function getSessionState(): Promise<SessionState> {
  // This reads the clock, which Cache Components cannot prerender. Waiting for
  // a real request keeps it out of the static shell.
  await connection();

  const jar = await cookies();
  const hasSession = jar.has(REFRESH_TOKEN_COOKIE_KEY);

  if (!hasSession) {
    return {
      hasSession: false,
      accessTokenExpiresAt: null,
      needsRefresh: false,
    };
  }

  const accessToken = jar.get(ACCESS_TOKEN_COOKIE_KEY)?.value;
  const accessTokenExpiresAt = accessToken
    ? decodeJwtExpiry(accessToken)
    : null;

  return {
    hasSession: true,
    accessTokenExpiresAt,
    needsRefresh:
      !accessToken ||
      (accessTokenExpiresAt !== null && accessTokenExpiresAt <= Date.now()),
  };
}

/**
 * Reads the `exp` claim out of a JWT. Returns null for anything unexpected
 * (opaque tokens, malformed payloads) so the caller can fall back to a plain
 * interval instead of refreshing in a loop.
 */
function decodeJwtExpiry(token: string): number | null {
  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { exp?: unknown };

    return typeof parsed.exp === "number" ? parsed.exp * 1000 : null;
  } catch {
    return null;
  }
}
