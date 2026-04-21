"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, PanelLeftClose, Rocket, Sparkles } from "lucide-react"
import { useMemo, useState } from "react"

import { EchoLogo } from "@/components/branding/echo-logo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navigation = [
  {
    href: "/dashboard",
    label: "Dashboard",
    match: (pathname: string) => pathname === "/dashboard",
  },
  {
    href: "/agents",
    label: "Agents",
    match: (pathname: string) =>
      pathname === "/agents" ||
      pathname === "/agents/new" ||
      (/^\/agents\/[^/]+$/.test(pathname)),
  },
  {
    href: "/agents/agt_support_core/analytics",
    label: "Analytics",
    match: (pathname: string) => /^\/agents\/[^/]+\/analytics$/.test(pathname),
  },
  {
    href: "/agents/agt_support_core/widget",
    label: "Widget",
    match: (pathname: string) => /^\/agents\/[^/]+\/widget$/.test(pathname),
  },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const activeLabel = useMemo(
    () => navigation.find((item) => item.match(pathname))?.label ?? "Workspace",
    [pathname]
  )

  return (
    <div className="min-h-screen bg-[var(--echo-canvas)] text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(17,181,164,0.14),_transparent_38%),radial-gradient(circle_at_80%_20%,_rgba(15,140,240,0.12),_transparent_32%),linear-gradient(180deg,_rgba(255,255,255,0.02),_transparent_35%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-[1600px]">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col border-r border-white/8 bg-[rgba(7,16,26,0.92)] px-5 py-5 backdrop-blur-xl transition-transform lg:static lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between">
            <EchoLogo href="/" compact />
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              onClick={() => setOpen(false)}
            >
              <PanelLeftClose />
            </Button>
          </div>

          <div className="mt-8 rounded-3xl border border-white/8 bg-white/5 p-4 shadow-[0_30px_100px_-55px_rgba(17,181,164,0.45)]">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--echo-accent)]">
              Live Stack
            </p>
            <h2 className="mt-3 text-xl font-semibold text-white">Northstar HVAC</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Ship agents, ingestion, analytics, and widget rollout from one control plane.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-zinc-300">
              <Sparkles className="size-3.5 text-[var(--echo-accent)]" />
              Echo environment is using resilient mock-safe API adapters.
            </div>
          </div>

          <nav className="mt-8 space-y-1">
            {navigation.map((item) => {
              const isActive = item.match(pathname)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center rounded-2xl px-4 py-3 text-sm transition-colors",
                    isActive
                      ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                      : "text-zinc-400 hover:bg-white/6 hover:text-zinc-100"
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto pt-8">
            <Link
              href="/agents/new"
              className="flex items-center justify-between rounded-2xl border border-[rgba(17,181,164,0.24)] bg-[rgba(17,181,164,0.08)] px-4 py-3 text-sm text-white transition hover:bg-[rgba(17,181,164,0.14)]"
            >
              Create a new agent
              <Rocket className="size-4 text-[var(--echo-accent)]" />
            </Link>
          </div>
        </aside>

        {open ? (
          <button
            aria-label="Close navigation"
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          />
        ) : null}

        <main className="relative flex min-h-screen flex-1 flex-col px-4 pb-10 pt-4 sm:px-6 lg:px-8">
          <header className="sticky top-0 z-20 mb-6 flex items-center justify-between rounded-[28px] border border-white/8 bg-[rgba(7,16,26,0.72)] px-4 py-3 backdrop-blur-xl sm:px-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon-sm"
                className="lg:hidden"
                onClick={() => setOpen(true)}
              >
                <Menu />
              </Button>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Echo Console
                </p>
                <h1 className="text-lg font-semibold text-white">{activeLabel}</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300 sm:block">
                api adapter: mock-safe
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-100">
                Maya Patel
              </div>
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  )
}
