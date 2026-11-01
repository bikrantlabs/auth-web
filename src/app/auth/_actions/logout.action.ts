"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { authApi } from "@/lib/api/auth.api";
import {
  ACCESS_TOKEN_COOKIE_KEY,
  PENDING_EMAIL_COOKIE,
  REFRESH_TOKEN_COOKIE_KEY,
  USER_COOKIE_KEY,
  VERIFICATION_RESEND_AVAILABLE_AT_COOKIE,
} from "@/lib/cookie-config";

// Keep logout snappy: if the API is slow or down, we still clear the session.
const LOGOUT_TIMEOUT_MS = 3_000;

export async function logoutAction() {
  const jar = await cookies();
  const refreshToken = jar.get(REFRESH_TOKEN_COOKIE_KEY)?.value;

  if (refreshToken) {
    try {
      // Best effort: revoke the refresh token server-side so it cannot be
      // replayed for the rest of its 7 day lifetime.
      await authApi.logout(
        { refreshToken },
        { signal: AbortSignal.timeout(LOGOUT_TIMEOUT_MS) },
      );
    } catch {
      // Ignore: the cookies are cleared below regardless.
    }
  }

  jar.delete(ACCESS_TOKEN_COOKIE_KEY);
  jar.delete(REFRESH_TOKEN_COOKIE_KEY);
  jar.delete(USER_COOKIE_KEY);
  jar.delete(PENDING_EMAIL_COOKIE);
  jar.delete(VERIFICATION_RESEND_AVAILABLE_AT_COOKIE);

  redirect("/");
}
