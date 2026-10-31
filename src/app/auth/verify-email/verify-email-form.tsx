"use client";

import { useActionState, useEffect, useState, useTransition } from "react";

import { toast } from "sonner";

import { Button } from "@/app/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/app/components/ui/input-otp";
import { useCountdown } from "@/hooks/use-countdown";

import { sendVerificationEmailAction } from "../_actions/send-verification-email.action";
import { verifyEmailAction } from "../_actions/verify-email.action";
import { FormSuccess } from "../_components/form-success";
import { FieldError } from "../../components/field-error";

const CODE_LENGTH = 6;
const SLOTS = Array.from({ length: CODE_LENGTH }, (_, index) => index);
const RESEND_COOLDOWN_MS = 30_000;

export function VerifyEmailForm() {
  const [state, formAction, isPending] = useActionState(verifyEmailAction, {});
  const [isResendPending, startResendTransition] = useTransition();
  const [code, setCode] = useState("");
  const resendCooldown = useCountdown();

  useEffect(() => {
    if (!state.message) return;

    if (state.success) {
      toast.success(state.message);
    } else {
      toast.error(state.message);
    }
  }, [state]);

  function handleResend() {
    if (isResendPending || resendCooldown.isActive) return;

    resendCooldown.start(RESEND_COOLDOWN_MS);

    startResendTransition(async () => {
      // We don't need to send email here, the email is automatically being read from server cookies
      const result = await sendVerificationEmailAction({}, new FormData());

      if (result.retryAfterMs !== undefined) {
        resendCooldown.start(result.retryAfterMs);
      }

      if (!result.message) return;

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  const hasError = Boolean(state.fieldErrors?.code);

  return (
    <div className="flex flex-col max-w-sm gap-4 mx-auto">
      <form action={formAction} className="w-full space-y-4">
        <div className="flex flex-col items-center gap-2">
          <InputOTP
            name="code"
            maxLength={CODE_LENGTH}
            pattern="^[0-9]+$"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={setCode}
            aria-invalid={hasError}
          >
            <InputOTPGroup>
              {SLOTS.map((index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className="size-10 text-base"
                  aria-invalid={hasError || undefined}
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <FieldError errors={state.fieldErrors?.code} />
        </div>

        <Button
          className="w-full"
          disabled={isPending || code.length !== CODE_LENGTH}
        >
          {isPending ? "Verifying..." : "Verify email"}
        </Button>
        {state.success && state.message && (
          <FormSuccess message={state.message} />
        )}
      </form>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Didn&apos;t receive the code?
        </p>
        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="link"
            size="sm"
            disabled={isResendPending || resendCooldown.isActive}
            onClick={handleResend}
          >
            {isResendPending ? "Sending..." : "Resend code"}
          </Button>
          {resendCooldown.isActive && (
            <span
              className="text-xs text-muted-foreground tabular-nums"
              aria-live="polite"
            >
              {resendCooldown.remainingSeconds}s
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
