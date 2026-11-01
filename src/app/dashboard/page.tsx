import Link from "next/link";
import { Suspense } from "react";

import { logoutAction } from "@/app/auth/_actions/logout.action";
import { Button } from "@/app/components/ui/button";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-black">
      <h1 className="text-2xl font-bold text-black dark:text-zinc-50">
        Protected Dashboard
      </h1>
      <Suspense fallback={<div>Loading...</div>}>
        <UserHeader />
      </Suspense>
      <div className="mt-8 flex gap-4">
        <form action={logoutAction}>
          <Button>Logout</Button>
        </form>
        <Link
          href="/"
          className="text-primary underline-offset-4 hover:underline"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}

async function UserHeader() {
  const user = await auth();
  return (
    <>
      {user && (
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          Welcome, {user.email}
        </p>
      )}
    </>
  );
}
