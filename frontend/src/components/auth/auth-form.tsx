"use client"

import Link from "next/link"

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 text-center">
      <h2 className="text-xl font-semibold">{mode === "signup" ? "Create your account" : "Sign in to Echo"}</h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Echo now uses Clerk with Google OAuth and email magic links. Use the Clerk form on this page to continue.
      </p>
      <Link href={mode === "signup" ? "/signup" : "/login"} className="mt-5 inline-flex text-sm font-semibold text-primary">
        Continue
      </Link>
    </div>
  )
}
