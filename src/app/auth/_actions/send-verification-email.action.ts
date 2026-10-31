"use server";

import {
  getPendingEmailFromCookie,
  getVerificationResendAvailableAt,
  setPendingEmailInCookie,
  setVerificationResendCooldown,
  VERIFICATION_RESEND_COOLDOWN_SECONDS,
} from "@/lib/_cookies";
import { authApi } from "@/lib/api/auth.api";
import { ApiError } from "@/lib/api/errors";

import { emailSchema } from "../_schemas";

export type SendVerificationEmailState = {
  success?: boolean;
  message?: string;
  errorCode?: string;
  retryAfterMs?: number;
  fieldErrors?: Partial<Record<"email", string[]>>;
};

export async function sendVerificationEmailAction(
  prevState: SendVerificationEmailState,
  formData: FormData,
): Promise<SendVerificationEmailState> {
  const resendAvailableAt = await getVerificationResendAvailableAt();
  if (resendAvailableAt) {
    const retryAfterMs = resendAvailableAt - Date.now();

    return {
      success: false,
      errorCode: "RATE_LIMIT_EXCEEDED",
      message: `Please wait ${Math.ceil(retryAfterMs / 1000)}s before requesting a new code.`,
      retryAfterMs,
    };
  }

  const emailInput = formData.get("email");
  const email =
    typeof emailInput === "string" && emailInput.length > 0
      ? emailInput
      : await getPendingEmailFromCookie();

  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) {
    return {
      fieldErrors: {
        email: parsed.error.issues.map((issue) => issue.message),
      },
    };
  }

  try {
    const res = await authApi.sendVerificationEmail({ email: parsed.data });
    await setPendingEmailInCookie(parsed.data);
    await setVerificationResendCooldown();

    return {
      success: true,
      message: res.message,
      retryAfterMs: VERIFICATION_RESEND_COOLDOWN_SECONDS * 1000,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        success: error.body.success,
        message: error.body.error.message,
        errorCode: error.body.error.code,
        fieldErrors: error.body.error.fields,
      };
    }
    throw error;
  }
}
