import "server-only";

import { cookies } from "next/headers";

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export const VERIFICATION_CODE_TTL_SECONDS = 5 * 60;

export const VERIFICATION_RESEND_COOLDOWN_SECONDS = 30;

const PENDING_EMAIL_COOKIE = "pending_email";
const VERIFICATION_RESEND_AVAILABLE_AT_COOKIE =
  "verification_resend_available_at";

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
