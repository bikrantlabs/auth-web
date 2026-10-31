"use server";

import { redirect } from "next/navigation";

import { z } from "zod";

import { setPendingEmailInCookie } from "@/lib/_cookies";
import { authApi } from "@/lib/api/auth.api";
import { ApiError } from "@/lib/api/errors";

import { registerSchema } from "../_schemas";
import { sendVerificationEmailAction } from "./send-verification-email.action";

type Field = keyof z.infer<typeof registerSchema>;

export type RegisterState = {
  success?: boolean;
  message?: string;
  errorCode?: string;
  fieldErrors?: Partial<Record<Field, string[]>>;
  values?: { email?: string; password?: string };
};

export async function registerUser(
  prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const rawInput = {
    email: formData.get("email")?.toString(),
    password: formData.get("password")?.toString(),
  };
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values: { email: rawInput.email, password: rawInput.password },
    };
  }

  try {
    await authApi.register(parsed.data);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.body.error.code === "UNVERIFIED_USER") {
        const result = await sendVerificationEmailAction({}, formData);

        if (result.success) {
          await setPendingEmailInCookie(parsed.data.email);
          redirect("/auth/verify-email");
        }

        return result;
      }

      return {
        success: error.body.success,
        message: error.body.error.message,
        errorCode: error.body.error.code,
        fieldErrors: error.body.error.fields,
        values: { email: rawInput.email, password: rawInput.password },
      };
    }

    throw error;
  }

  await setPendingEmailInCookie(parsed.data.email);
  redirect("/auth/verify-email");
}
