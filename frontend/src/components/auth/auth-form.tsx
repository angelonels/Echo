"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { useForm } from "react-hook-form"

import { EchoLogo } from "@/components/branding/echo-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { login, signup } from "@/lib/api/echo"
import {
  authFormSchema,
  signupFormSchema,
  type AuthFormValues,
  type SignupFormValues,
} from "@/lib/api/schemas"
import { cn } from "@/lib/utils"

type AuthMode = "login" | "signup"

export function AuthForm({ mode }: { mode: AuthMode }) {
  const isSignup = mode === "signup"
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      companyName: "",
      fullName: "",
      email: "",
      password: "",
    },
  })

  const loginForm = useForm<AuthFormValues>({
    resolver: zodResolver(authFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  function onSignup(values: SignupFormValues) {
    startTransition(async () => {
      const result = await signup(values)
      router.push(result.redirectTo)
    })
  }

  function onLogin(values: AuthFormValues) {
    startTransition(async () => {
      const result = await login(values)
      router.push(result.redirectTo)
    })
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden border-r border-white/8 bg-[var(--echo-surface)] lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(17,181,164,0.16),_transparent_30%),radial-gradient(circle_at_80%_30%,_rgba(15,140,240,0.18),_transparent_32%)]" />
        <div className="relative flex h-full flex-col justify-between px-10 py-10">
          <EchoLogo />
          <div className="max-w-xl space-y-6">
            <p className="text-xs uppercase tracking-[0.32em] text-[var(--echo-accent)]">
              Built for lean teams
            </p>
            <h1 className="max-w-lg text-5xl font-semibold tracking-[-0.04em] text-white">
              Get your support content into shape before the widget goes live.
            </h1>
            <p className="max-w-xl text-base leading-7 text-zinc-300">
              Echo gives you one place to configure the agent, upload material, test responses,
              and publish a support experience that feels consistent with the rest of the product.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Grounded responses", "retrieval + confidence"],
                ["Operator analytics", "fallbacks and friction"],
                ["Widget rollout", "brand-aligned embed"],
              ].map(([title, copy]) => (
                <div
                  key={title}
                  className="rounded-3xl border border-white/8 bg-white/5 px-4 py-5"
                >
                  <div className="text-sm font-medium text-white">{title}</div>
                  <div className="mt-2 text-sm text-zinc-400">{copy}</div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-sm text-zinc-500">
            Set it up once, test it properly, and ship it when the answers look right.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="animate-fade-up w-full max-w-md rounded-[32px] border border-white/8 bg-[rgba(7,16,26,0.84)] p-8 shadow-[0_36px_120px_-62px_rgba(17,181,164,0.45)] backdrop-blur-xl">
          <div className="mb-8 space-y-4">
            <div className="lg:hidden">
              <EchoLogo />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-[var(--echo-accent)]">
                {isSignup ? "Create workspace" : "Welcome back"}
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white">
                {isSignup ? "Set up Echo" : "Sign in to Echo"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {isSignup
                  ? "Create your company workspace and launch your first support agent."
                  : "Access your admin console, agent analytics, and widget settings."}
              </p>
            </div>
          </div>

          {isSignup ? (
            <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
              <Field
                label="Company name"
                error={signupForm.formState.errors.companyName?.message}
              >
                <Input {...signupForm.register("companyName")} placeholder="Northstar HVAC" />
              </Field>
              <Field label="Full name" error={signupForm.formState.errors.fullName?.message}>
                <Input {...signupForm.register("fullName")} placeholder="Maya Patel" />
              </Field>

              <Field label="Work email" error={signupForm.formState.errors.email?.message}>
                <Input
                  type="email"
                  {...signupForm.register("email")}
                  placeholder="ops@northstarhvac.com"
                />
              </Field>

              <Field label="Password" error={signupForm.formState.errors.password?.message}>
                <Input
                  type="password"
                  {...signupForm.register("password")}
                  placeholder="StrongPassword123!"
                />
              </Field>

              <Button
                type="submit"
                size="lg"
                className="mt-3 h-12 w-full rounded-2xl bg-[var(--echo-accent)] text-slate-950 hover:bg-[var(--echo-accent-strong)]"
                disabled={pending}
              >
                {pending ? "Creating workspace..." : "Create agent workspace"}
              </Button>
            </form>
          ) : (
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
              <Field label="Work email" error={loginForm.formState.errors.email?.message}>
                <Input
                  type="email"
                  {...loginForm.register("email")}
                  placeholder="ops@northstarhvac.com"
                />
              </Field>

              <Field label="Password" error={loginForm.formState.errors.password?.message}>
                <Input
                  type="password"
                  {...loginForm.register("password")}
                  placeholder="StrongPassword123!"
                />
              </Field>

              <Button
                type="submit"
                size="lg"
                className="mt-3 h-12 w-full rounded-2xl bg-[var(--echo-accent)] text-slate-950 hover:bg-[var(--echo-accent-strong)]"
                disabled={pending}
              >
                {pending ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          )}

          <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
            <span>{isSignup ? "Already have an account?" : "Need an account?"}</span>
            <Link
              href={isSignup ? "/login" : "/signup"}
              className="font-medium text-[var(--echo-accent)] transition hover:text-[var(--echo-accent-strong)]"
            >
              {isSignup ? "Log in" : "Create one"}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-zinc-200">{label}</span>
      {children}
      <span className={cn("block min-h-5 text-xs", error ? "text-rose-400" : "text-transparent")}>
        {error ?? "ok"}
      </span>
    </label>
  )
}
