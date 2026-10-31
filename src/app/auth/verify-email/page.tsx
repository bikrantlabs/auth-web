import { redirect } from "next/navigation";

import { getPendingEmailFromCookie } from "../../../lib/_cookies";
import { VerifyEmailForm } from "./verify-email-form";

export const instant = false;

export default async function VerifyEmailPage() {
  const email = await getPendingEmailFromCookie();

  if (!email) {
    redirect("/auth/register");
  }

  return (
    <div>
      <h1>Verify your email</h1>
      <p>We sent a 6-digit code to {email}.</p>
      <VerifyEmailForm />
    </div>
  );
}
