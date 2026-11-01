// Plain shared module: no "server-only", no next/headers.
// Imported by both the proxy and the server cookie helpers.

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

// The API issues 15 minute access tokens. We expire the cookie a minute early
// so the proxy starts the refreshing process before the API ever rejects one.
export const ACCESS_TOKEN_MAX_AGE = 14 * 60; // 14 minutes
export const ACCESS_TOKEN_COOKIE_KEY = "access_token";

export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days
export const REFRESH_TOKEN_COOKIE_KEY = "refresh_token";

export const USER_COOKIE_KEY = "user";

export const PENDING_EMAIL_COOKIE = "pending_email";
export const VERIFICATION_RESEND_AVAILABLE_AT_COOKIE =
  "verification_resend_available_at";

export const VERIFICATION_CODE_TTL_SECONDS = 5 * 60;
export const VERIFICATION_RESEND_COOLDOWN_SECONDS = 30;
