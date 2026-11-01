import "server-only";

import { cookies } from "next/headers";

import type { Token, User } from "./api/response";
import {
  ACCESS_TOKEN_COOKIE_KEY,
  ACCESS_TOKEN_MAX_AGE,
  COOKIE_OPTIONS,
  PENDING_EMAIL_COOKIE,
  REFRESH_TOKEN_COOKIE_KEY,
  REFRESH_TOKEN_MAX_AGE,
  USER_COOKIE_KEY,
  VERIFICATION_CODE_TTL_SECONDS,
  VERIFICATION_RESEND_AVAILABLE_AT_COOKIE,
  VERIFICATION_RESEND_COOLDOWN_SECONDS,
} from "./cookie-config";

// Re-exported so existing `@/lib/_cookies` imports keep working.
export * from "./cookie-config";

export async function setSessionInCookie(tokens: Token, user: User) {
  const jar = await cookies();
  await setTokensInCookie(tokens);
  jar.set(USER_COOKIE_KEY, JSON.stringify(user), {
    ...COOKIE_OPTIONS,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

export async function setTokensInCookie(tokens: Token) {
  const jar = await cookies();

  jar.set(ACCESS_TOKEN_COOKIE_KEY, tokens.accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });
  jar.set(REFRESH_TOKEN_COOKIE_KEY, tokens.refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

export async function clearSessionCookies() {
  const jar = await cookies();

  jar.delete(ACCESS_TOKEN_COOKIE_KEY);
  jar.delete(REFRESH_TOKEN_COOKIE_KEY);
  jar.delete(USER_COOKIE_KEY);
}

export async function setPendingEmailInCookie(email: string) {
  const jar = await cookies();
  jar.set(PENDING_EMAIL_COOKIE, email, {
    ...COOKIE_OPTIONS,
    maxAge: VERIFICATION_CODE_TTL_SECONDS * 2,
  });
}

export async function clearPendingEmailCookie() {
  const jar = await cookies();
  jar.delete(PENDING_EMAIL_COOKIE);
}

export async function getPendingEmailFromCookie() {
  const jar = await cookies();
  return jar.get(PENDING_EMAIL_COOKIE)?.value;
}

export async function setVerificationResendCooldown() {
  const jar = await cookies();
  jar.set(
    VERIFICATION_RESEND_AVAILABLE_AT_COOKIE,
    String(Date.now() + VERIFICATION_RESEND_COOLDOWN_SECONDS * 1000),
    { ...COOKIE_OPTIONS, maxAge: VERIFICATION_RESEND_COOLDOWN_SECONDS },
  );
}

export async function getVerificationResendAvailableAt() {
  const jar = await cookies();
  const value = jar.get(VERIFICATION_RESEND_AVAILABLE_AT_COOKIE)?.value;
  if (!value) return null;

  const availableAt = Number(value);
  return Number.isFinite(availableAt) && availableAt > Date.now()
    ? availableAt
    : null;
}
