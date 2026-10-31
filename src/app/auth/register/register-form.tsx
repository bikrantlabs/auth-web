"use client";

import { useActionState, useEffect } from "react";

import { cn } from "cn";
import { toast } from "sonner";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

import { FormSuccess } from "../_components/form-success";
import { FieldError } from "../../components/field-error";
import { registerUser } from "../_actions/register.action";

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerUser, {});

  useEffect(() => {
    console.log(state);
    if (!state.message) return;

    if (state.success) {
      toast.success(state.message);
    } else {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <div className="flex flex-col max-w-sm gap-4 mx-auto">
      <form action={formAction} className="w-full space-y-4">
        <div>
          <Input
            name="email"
            placeholder="Email"
            defaultValue={state.values?.email}
            className={cn(state.fieldErrors?.email ? "border-destructive" : "")}
          />
          <FieldError errors={state.fieldErrors?.email} />
        </div>
        <div>
          <Input
            name="password"
            // type="password"
            placeholder="Password"
            defaultValue={state.values?.password}
            className={cn(
              state.fieldErrors?.password ? "border-destructive" : "",
            )}
          />
          <FieldError errors={state.fieldErrors?.password} />
        </div>

        <Button className="w-full" disabled={isPending}>
          {isPending ? "Submitting..." : "Register"}
        </Button>
        {state.success && state.message && (
          <FormSuccess message={state.message} />
        )}
      </form>

      <Button>Login</Button>
    </div>
  );
}
