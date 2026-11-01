import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  clearSessionCookies,
  REFRESH_TOKEN_COOKIE_KEY,
  setTokensInCookie,
} from "@/lib/_cookies";
import { authApi } from "@/lib/api/auth.api";
import {
  getErrorStatus,
  RETRYABLE_STATUS_CODES,
  withRetry,
} from "@/lib/api/retry";

export async function POST() {
  const jar = await cookies();
  const refreshToken = jar.get(REFRESH_TOKEN_COOKIE_KEY)?.value;

  // No refresh token means there is no session to recover.
  if (!refreshToken) {
    await clearSessionCookies();

    return NextResponse.json({ status: "UNAUTHENTICATED" }, { status: 401 });
  }

  try {
    const response = await withRetry(
      () => authApi.refreshTokens({ refreshToken }),
      { retryOn: RETRYABLE_STATUS_CODES },
    );

    await setTokensInCookie(response.data);

    return NextResponse.json({
      status: "success",
    });
  } catch (error) {
    const status = getErrorStatus(error);

    // The refresh token is invalid, expired, or revoked.
    if (status === 401 || status === 403) {
      await clearSessionCookies();

      return NextResponse.json({ status: "UNAUTHENTICATED" }, { status: 401 });
    }

    // Network errors and server errors should not destroy the session.
    return NextResponse.json(
      { status: "TEMPORARILY_UNAVAILABLE" },
      { status: 503 },
    );
  }
}
