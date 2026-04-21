import Link from "next/link"
import { ArrowRight, Bot, ChartColumn, FileStack, LockKeyhole, Orbit, PanelsTopLeft } from "lucide-react"

import { EchoLogo } from "@/components/branding/echo-logo"

const featureCards = [
  {
    icon: FileStack,
    title: "Document-backed answers",
    description:
      "Upload policies, playbooks, and product docs. Echo shapes support responses around what your team has actually approved.",
  },
  {
    icon: Bot,
    title: "Distinct agents for distinct jobs",
    description:
      "Run separate agents for support, aftercare, and operations, each with its own documents, greeting, domains, and widget theme.",
  },
  {
    icon: ChartColumn,
    title: "Operational analytics",
    description:
      "Track fallback rate, question volume, and sentiment so you can tune the system before support quality slips.",
  },
  {
    icon: LockKeyhole,
    title: "Credible for small teams",
    description:
      "Echo is built for teams that need a serious system without building a bespoke support AI platform from scratch.",
  },
]

const steps = [
  "Set up your workspace and define the first agent your support team needs.",
  "Upload the docs your team already trusts and watch ingestion move into a ready state.",
  "Test real questions, check confidence, and ship the widget only when the answers look right.",
]

export function LandingSections() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(17,181,164,0.16),_transparent_28%),radial-gradient(circle_at_75%_20%,_rgba(15,140,240,0.18),_transparent_30%)]" />

      <header className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <EchoLogo />
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-zinc-300 transition hover:text-white">
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-11 items-center rounded-full bg-[var(--echo-accent)] px-5 text-sm font-medium text-slate-950 transition hover:bg-[var(--echo-accent-strong)]"
          >
            Create an agent
          </Link>
        </div>
      </header>

      <main className="relative">
        <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-18 pt-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-24 lg:pt-14">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--echo-accent)]">
              AI support platform
            </p>
            <h1 className="animate-fade-up mt-5 text-5xl font-semibold tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl">
              Support agents grounded in your documents, not improvisation.
            </h1>
            <p className="animate-fade-up-delay mt-6 max-w-xl text-base leading-8 text-zinc-300">
              Echo helps small teams turn existing support material into a customer-facing agent
              with clean controls for testing, monitoring, and rollout.
            </p>
            <div className="animate-fade-up-delay-2 mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center rounded-full bg-[var(--echo-accent)] px-6 text-sm font-medium text-slate-950 transition hover:bg-[var(--echo-accent-strong)]"
              >
                Create your first agent
                <ArrowRight className="ml-1 size-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center rounded-full border border-white/10 px-5 text-sm text-zinc-200 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
              >
                View the admin console
              </Link>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ["18 docs", "vectorized this week"],
                ["0.81 avg confidence", "current production baseline"],
                ["12% fallback rate", "visible before launch"],
              ].map(([value, label]) => (
                <div key={value} className="rounded-3xl border border-white/8 bg-white/5 p-4 transition duration-300 hover:-translate-y-1 hover:border-white/16 hover:bg-white/6">
                  <div className="text-2xl font-semibold text-white">{value}</div>
                  <div className="mt-1 text-sm text-zinc-400">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-float-soft">
            <div className="absolute inset-0 translate-x-6 translate-y-8 rounded-[36px] bg-[rgba(17,181,164,0.16)] blur-3xl" />
            <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[rgba(7,16,26,0.86)] p-5 shadow-[0_40px_140px_-70px_rgba(17,181,164,0.55)] backdrop-blur-xl">
              <div className="flex items-center justify-between rounded-[28px] border border-white/8 bg-white/5 px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Live workspace preview</p>
                  <p className="mt-1 text-lg font-medium text-white">Northstar support desk</p>
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                  grounded live
                </span>
              </div>

              <div className="mt-5 grid gap-4">
                <div className="grid gap-4 sm:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-[28px] border border-white/8 bg-[var(--echo-panel)] p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-zinc-400">Test answer</p>
                        <p className="mt-2 text-xl font-medium text-white">“Labor is covered for the first year, and parts stay covered for five.”</p>
                      </div>
                      <Orbit className="size-6 text-[var(--echo-accent)]" />
                    </div>
                    <div className="mt-6 flex items-center gap-3 text-sm text-zinc-300">
                      <span className="rounded-full bg-white/6 px-3 py-1">confidence 0.93</span>
                      <span className="rounded-full bg-white/6 px-3 py-1">grounded answer</span>
                    </div>
                  </div>
                  <div className="rounded-[28px] border border-white/8 bg-[var(--echo-panel)] p-5">
                    <p className="text-sm text-zinc-400">Ingestion progress</p>
                    <div className="mt-4 h-2 rounded-full bg-white/8">
                      <div className="h-full w-[72%] rounded-full bg-[var(--echo-accent)]" />
                    </div>
                    <div className="mt-3 text-sm text-zinc-300">3 files processing</div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/8 bg-[var(--echo-panel)] p-5">
                  <div className="flex items-center gap-3">
                    <PanelsTopLeft className="size-5 text-[var(--echo-accent)]" />
                    <div>
                      <p className="text-sm text-zinc-400">Website install</p>
                      <p className="text-base font-medium text-white">Brand color set and embed code ready</p>
                    </div>
                  </div>
                  <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/8 bg-[#081018] p-4 text-xs leading-6 text-zinc-300">
                    {`<script src="https://cdn.echo.ai/widget.js"></script>
<script>
  EchoWidget.init({
    agentKey: "echo_pub_support_core",
    primaryColor: "#11b5a4",
    position: "right"
  })
</script>`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-18 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-[var(--echo-accent)]">
                Why Echo
              </p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">
                Small companies need support automation that reads like a good support team, not a gimmick.
              </h2>
              <p className="mt-4 max-w-md text-base leading-8 text-zinc-400">
                Most teams do not need an AI lab. They need a clear path from approved docs to
                trustworthy support automation, with enough visibility to know when the system is
                helping and when it should hand off.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {featureCards.map((feature) => {
                const Icon = feature.icon
                return (
                  <article
                    key={feature.title}
                    className="rounded-[30px] border border-white/8 bg-[var(--echo-panel)] p-6 shadow-[0_24px_90px_-60px_rgba(15,140,240,0.35)]"
                  >
                    <Icon className="size-5 text-[var(--echo-accent)]" />
                    <h3 className="mt-4 text-xl font-medium text-white">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-zinc-400">{feature.description}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-18 sm:px-6 lg:px-8">
          <div className="rounded-[36px] bg-[rgba(7,16,26,0.82)] p-8 shadow-[0_30px_100px_-80px_rgba(15,140,240,0.4)] lg:p-10">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-[var(--echo-accent)]">
                  How it works
                </p>
                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">
                  One path from setup to deployment.
                </h2>
                <p className="mt-4 text-base leading-8 text-zinc-400">
                  Echo keeps the path short: create an agent, ingest your material, test the
                  answers, and install the widget when the output is ready for customers.
                </p>
              </div>
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div key={step} className="flex gap-4 rounded-[28px] bg-white/5 p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--echo-accent)] text-sm font-semibold text-slate-950">
                      0{index + 1}
                    </div>
                    <p className="pt-1 text-sm leading-7 text-zinc-300">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 rounded-[40px] bg-[linear-gradient(135deg,rgba(17,181,164,0.12),rgba(15,140,240,0.08))] px-8 py-10 shadow-[inset_0_0_0_1px_rgba(17,181,164,0.12)] lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.32em] text-[var(--echo-accent)]">
                Start with one strong use case
              </p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">
                Build the first agent your team would actually hand to customers.
              </h2>
            </div>
            <Link
              href="/signup"
              className="inline-flex h-12 items-center rounded-full bg-white px-6 text-sm font-medium text-slate-950 transition hover:bg-zinc-100"
            >
              Start with signup
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
