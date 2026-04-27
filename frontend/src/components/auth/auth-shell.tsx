"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { SignIn, SignUp } from "@clerk/nextjs"
import { FormEvent, useState } from "react"
import { GoogleLogo, ArrowLeft, Envelope, PaperPlaneTilt, ArrowRight } from "@phosphor-icons/react"

import { EchoLogo } from "@/components/branding/echo-logo"
import { cn } from "@/lib/utils"

type AuthShellProps = {
  mode: "login" | "signup"
  clerkEnabled?: boolean
}

export function AuthShell({ mode, clerkEnabled = false }: AuthShellProps) {
  const isSignup = mode === "signup"

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#f4eddf] text-[#18140f]">
      {/* Background system */}
      <div className="pointer-events-none fixed inset-0 echo-noise opacity-70" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(197,111,69,0.18),transparent_28%),radial-gradient(circle_at_82%_84%,rgba(15,118,110,0.16),transparent_30%),linear-gradient(180deg,rgba(255,250,240,0.78),rgba(244,237,223,0.94))]" />

      <div className="relative mx-auto flex min-h-[100dvh] max-w-[620px] flex-col px-5 py-6">
        {/* Header with back navigation */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-between"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[#6d604f] transition-colors duration-300 hover:text-[#18140f]"
          >
            <ArrowLeft size={16} weight="bold" />
            Back
          </Link>
          <EchoLogo imageClassName="h-9" />
          <Link
            href={isSignup ? "/login" : "/signup"}
            className="text-sm font-medium text-[#0f766e] transition-colors duration-300 hover:text-[#18140f]"
          >
            {isSignup ? "Sign in" : "Sign up"}
          </Link>
        </motion.header>

        {/* Main auth content */}
        <section className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-[460px]">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            >
              {/* Title area */}
              <div className="mb-6 text-center">
                <motion.h1
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.45 }}
                  className="text-3xl font-semibold tracking-[-0.03em] text-[#18140f]"
                >
                  {isSignup ? "Create your account" : "Welcome back"}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="mt-2 text-sm leading-6 text-[#6d604f]"
                >
                  {isSignup
                    ? "Start building your AI support agent in minutes."
                    : "Sign in to manage your support agents and knowledge."}
                </motion.p>
              </div>

              {/* Card */}
              <div className="rounded-[2.2rem] border border-[#2c2118]/10 bg-[#fffaf0]/86 p-2 shadow-[0_34px_100px_-72px_rgba(70,52,33,0.55)]">
                <div className="rounded-[1.85rem] border border-[#2c2118]/10 bg-[#fbf4e7] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.85)]">
                  {clerkEnabled && isSignup ? (
                    <SignUp signInUrl="/login" fallbackRedirectUrl="/app" appearance={clerkAppearance} />
                  ) : clerkEnabled ? (
                    <SignIn signUpUrl="/signup" fallbackRedirectUrl="/app" appearance={clerkAppearance} />
                  ) : (
                    <FallbackAuthCard mode={mode} />
                  )}
                </div>
              </div>

              {/* Terms */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="mt-5 text-center text-xs leading-5 text-[#9b8d7a]"
              >
                By continuing, you agree to Echo&apos;s{" "}
                <a href="#" className="text-[#6d604f] underline decoration-[#6d604f]/30 transition-colors hover:text-[#18140f]">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-[#6d604f] underline decoration-[#6d604f]/30 transition-colors hover:text-[#18140f]">
                  Privacy Policy
                </a>
                .
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Bottom feature highlights */}
        <motion.footer
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.45 }}
          className="flex flex-wrap justify-center gap-4 pb-2 text-xs text-[#9b8d7a]"
        >
          {["Document-grounded", "Traceable answers", "Knowledge gaps", "No code widget"].map((feature) => (
            <span key={feature} className="flex items-center gap-1.5">
              <span className="size-1 rounded-full bg-[#0f766e]/40" />
              {feature}
            </span>
          ))}
        </motion.footer>
      </div>
    </main>
  )
}

function FallbackAuthCard({ mode }: { mode: "login" | "signup" }) {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [focused, setFocused] = useState(false)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address.")
      return
    }

    setError("")
    setSent(true)
  }

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="mx-auto grid size-16 place-items-center rounded-2xl border border-[#0f766e]/18 bg-[#0f766e]/8">
          <PaperPlaneTilt size={28} weight="duotone" className="text-[#0f766e]" />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-[#18140f]">Check your inbox</h2>
        <p className="mt-3 text-sm leading-6 text-[#5f5245]">
          We sent a secure sign-in link to{" "}
          <span className="font-medium text-[#31271d]">{email}</span>. Open the link to continue
          building your support agent.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false)
            setEmail("")
          }}
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#0f766e] transition-colors duration-300 hover:text-[#18140f]"
        >
          <ArrowLeft size={14} weight="bold" />
          Use a different email
        </button>
      </motion.div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {/* Google button */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.985 }}
        className="group inline-flex h-12 items-center justify-center gap-3 rounded-full bg-[#18140f] text-sm font-semibold text-[#fffaf0] transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#0f766e]"
      >
        <GoogleLogo size={20} weight="bold" />
        Continue with Google
      </motion.button>

      {/* Divider */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-xs text-[#9b8d7a]">
        <span className="h-px bg-[#2c2118]/10" />
        or continue with email
        <span className="h-px bg-[#2c2118]/10" />
      </div>

      {/* Email input */}
      <label className="grid gap-2">
        <span className="text-sm font-medium text-[#31271d]">Email address</span>
        <div
          className={cn(
            "relative rounded-[1.1rem] border bg-[#fffaf0] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
            focused ? "border-[#0f766e] shadow-[0_0_0_3px_rgba(15,118,110,0.1)]" : "border-[#2c2118]/10",
            error ? "border-rose-400 shadow-[0_0_0_3px_rgba(190,18,60,0.08)]" : "",
          )}
        >
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9b8d7a]">
            <Envelope size={18} weight="duotone" />
          </div>
          <input
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              if (error) setError("")
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="you@example.com"
            className="h-12 w-full rounded-[1.1rem] bg-transparent pl-11 pr-4 text-sm text-[#18140f] outline-none placeholder:text-[#9b8d7a]"
          />
        </div>
        <span
          className={cn(
            "text-xs transition-colors",
            error ? "text-rose-600" : "text-[#9b8d7a]",
          )}
        >
          {error || "We\u2019ll send a secure email link to sign in."}
        </span>
      </label>

      {/* Submit button */}
      <motion.button
        type="submit"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.985 }}
        className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#0f766e] text-sm font-semibold text-[#fffaf0] transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#18140f]"
      >
        {mode === "signup" ? "Create account" : "Send magic link"}
        <ArrowRight size={16} weight="bold" className="transition-transform duration-300 group-hover:translate-x-0.5" />
      </motion.button>

      {/* Switch mode */}
      <p className="text-center text-sm text-[#6d604f]">
        {mode === "signup" ? "Already have an account? " : "Don\u2019t have an account? "}
        <Link
          href={mode === "signup" ? "/login" : "/signup"}
          className="font-medium text-[#0f766e] transition-colors duration-300 hover:text-[#18140f]"
        >
          {mode === "signup" ? "Sign in" : "Sign up"}
        </Link>
      </p>
    </form>
  )
}

const clerkAppearance = {
  variables: {
    colorPrimary: "#0f766e",
    colorText: "#18140f",
    colorTextSecondary: "#6d604f",
    colorBackground: "#fbf4e7",
    colorInputBackground: "#fffaf0",
    colorInputText: "#18140f",
    borderRadius: "0.9rem",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full shadow-none",
    card: "bg-transparent border-0 shadow-none p-0",
    header: "hidden",
    footer: "hidden",
    socialButtonsBlockButton:
      "h-12 rounded-full border border-[#2c2118]/10 bg-[#18140f] text-[#fffaf0] text-sm font-semibold hover:bg-[#0f766e] transition duration-500",
    dividerLine: "bg-[#2c2118]/10",
    dividerText: "text-[#9b8d7a] text-xs",
    formFieldLabel: "text-[#31271d] text-sm font-medium",
    formFieldInput:
      "h-12 rounded-[1.1rem] border border-[#2c2118]/10 bg-[#fffaf0] text-[#18140f] shadow-none focus:border-[#0f766e] focus:shadow-[0_0_0_3px_rgba(15,118,110,0.1)] transition-all duration-300",
    formButtonPrimary:
      "h-12 rounded-full bg-[#0f766e] text-[#fffaf0] text-sm font-semibold hover:bg-[#18140f] active:scale-[0.985] transition duration-500",
    formFieldErrorText: "text-rose-600 text-xs",
    identityPreviewText: "text-[#31271d]",
    otpCodeFieldInput: "border-[#2c2118]/10 bg-[#fffaf0] text-[#18140f]",
  },
} as const
