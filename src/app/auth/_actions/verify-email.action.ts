"use server";

import { redirect } from "next/navigation";

import { z } from "zod";

import {
  clearPendingEmailCookie,
  getPendingEmailFromCookie,
  setSessionInCookie,
} from "@/lib/_cookies";
import { authApi } from "@/lib/api/auth.api";
import { ApiError } from "@/lib/api/errors";

import { verifyEmailSchema } from "../_schemas";

type Field = keyof z.infer<typeof verifyEmailSchema>;

export type VerifyEmailState = {
  success?: boolean;
  message?: string;
  fieldErrors?: Partial<Record<Field, string[]>>;
  values?: { email?: string; code?: string };
};

export async function verifyEmailAction(
  prevState: VerifyEmailState,
  formData: FormData,
): Promise<VerifyEmailState> {
  const email = await getPendingEmailFromCookie();
  if (!email) {
    return {
      success: false,
      message: "Your verification window expired. Please register again.",
    };
  }

  const code = formData.get("code");

  const rawInput = {
    email,
    code: typeof code === "string" ? code : "",
  };

  const parsed = verifyEmailSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values: rawInput,
    };
  }

  try {
    const res = await authApi.verifyEmail(parsed.data);

    await setSessionInCookie(res.data.tokens, res.data.user);

    await clearPendingEmailCookie();
    redirect("/");
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        success: error.body.success,
        message: error.body.error.message,
      };
    }
    throw error;
  }
}
