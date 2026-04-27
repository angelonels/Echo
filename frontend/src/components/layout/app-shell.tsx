"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  BookOpen,
  Robot,
  SquaresFour,
  List,
  Plus,
  Gear,
} from "@phosphor-icons/react"

import { EchoLogo } from "@/components/branding/echo-logo"
import { cn } from "@/lib/utils"

const navigation = [
  {
    href: "/app",
    label: "Dashboard",
    icon: SquaresFour,
    match: (pathname: string) => pathname === "/app",
  },
  {
    href: "/app/agents",
    label: "Agents",
    icon: Robot,
    match: (pathname: string) => pathname === "/app/agents" || /^\/app\/agents\/?/.test(pathname),
  },
  {
    href: "/app/settings",
    label: "Settings",
    icon: Gear,
    match: (pathname: string) => pathname === "/app/settings",
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
    <div className="min-h-screen bg-[#f4eddf] text-[#18140f] font-sans selection:bg-[#0f766e]/20 selection:text-[#0f766e]">
      {/* Background system */}
      <div className="pointer-events-none fixed inset-0 echo-noise opacity-70" />
      
      <div className="mx-auto flex min-h-screen max-w-[1500px] relative">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-72 border-r border-[#2c2118]/10 bg-[#fffaf0]/95 px-5 py-5 shadow-[24px_0_80px_-60px_rgba(70,52,33,0.45)] backdrop-blur-2xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] lg:static lg:block lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between">
              <EchoLogo href="/app" imageClassName="h-9" />
              <button 
                type="button"
                className="lg:hidden grid size-8 place-items-center rounded-lg hover:bg-[#2c2118]/5 text-[#6d604f]" 
                onClick={() => setOpen(false)}
              >
                <List size={20} weight="bold" />
              </button>
            </div>

            <Link
              href="/app/agents/new"
              className="mt-8 group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#18140f] px-4 text-sm font-semibold text-[#fffaf0] transition-all duration-500 hover:bg-[#0f766e] active:scale-[0.985] shadow-[0_4px_14px_0_rgba(24,20,15,0.25)] hover:shadow-[0_6px_20px_rgba(15,118,110,0.35)]"
            >
              <Plus size={16} weight="bold" className="transition-transform duration-300 group-hover:rotate-90" />
              New agent
            </Link>

            <nav className="mt-7 grid gap-1.5">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = item.match(pathname)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
                      isActive
                        ? "bg-[#0f766e]/10 text-[#0f766e]"
                        : "text-[#6d604f] hover:bg-[#2c2118]/5 hover:text-[#18140f]"
                    )}
                  >
                    <Icon size={18} weight={isActive ? "fill" : "duotone"} className={cn("transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="mt-auto rounded-[1.35rem] border border-[#0f766e]/15 bg-[#0f766e]/5 p-5 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 size-24 rounded-full bg-[#0f766e]/10 blur-2xl" />
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0f766e]">
                <BookOpen size={18} weight="duotone" />
                Phase 1-3
              </div>
              <p className="mt-3 text-xs leading-5 text-[#31271d]">
                Build agents, ingest docs, and test grounded answers before widget launch.
              </p>
            </div>
          </div>
        </aside>

        <AnimatePresence>
          {open && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-30 bg-[#18140f]/20 backdrop-blur-sm lg:hidden"
            />
          )}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[#2c2118]/10 bg-[#f4eddf]/85 px-4 py-3 backdrop-blur-xl md:px-7">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button 
                  type="button"
                  className="lg:hidden grid size-9 place-items-center rounded-xl bg-[#fffaf0] border border-[#2c2118]/10 shadow-sm text-[#31271d]" 
                  onClick={() => setOpen(true)}
                >
                  <List size={20} weight="bold" />
                </button>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-[#817464]">Echo admin</p>
                  <h1 className="text-lg font-semibold text-[#18140f] tracking-tight">{activeLabel}</h1>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 mr-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0f766e] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0f766e]"></span>
                  </span>
                  <span className="text-xs font-medium text-[#6d604f]">Systems operational</span>
                </div>
                <div className="h-8 w-px bg-[#2c2118]/10 hidden md:block" />
                <div className="rounded-full border border-[#2c2118]/10 p-1 bg-[#fffaf0] shadow-sm">
                  <UserButton appearance={{
                    elements: {
                      userButtonAvatarBox: "size-7"
                    }
                  }} />
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-7 md:px-7 md:py-10">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  )
}
