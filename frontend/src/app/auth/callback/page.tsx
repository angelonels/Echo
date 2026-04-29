import { AuthenticateWithRedirectCallback } from "@clerk/nextjs"
import Link from "next/link"

export default function AuthCallbackPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[#f4eddf] px-5 text-[#18140f]">
        <div className="pointer-events-none fixed inset-0 echo-noise opacity-70" />
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(197,111,69,0.18),transparent_28%),radial-gradient(circle_at_82%_84%,rgba(15,118,110,0.16),transparent_30%),linear-gradient(180deg,rgba(255,250,240,0.78),rgba(244,237,223,0.94))]" />
        <div className="relative max-w-md rounded-[2.2rem] border border-[#2c2118]/10 bg-[#fffaf0]/86 p-2 shadow-[0_34px_100px_-72px_rgba(70,52,33,0.55)]">
          <div className="rounded-[1.85rem] border border-[#2c2118]/10 bg-[#fbf4e7] p-6 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.85)]">
            <h1 className="text-2xl font-semibold text-[#18140f]">Clerk is not configured</h1>
            <p className="mt-3 text-sm leading-6 text-[#6d604f]">
              Add the Clerk publishable key to enable the hosted callback flow.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#0f766e] px-5 text-sm font-semibold text-[#fffaf0] transition duration-500 hover:bg-[#18140f]"
            >
              Back to login
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return <AuthenticateWithRedirectCallback />
}
