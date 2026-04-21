import Link from "next/link"
import { ArrowRight, Plus } from "lucide-react"

import { getAgents } from "@/lib/api/echo"

export default async function AgentsPage() {
  const agents = await getAgents()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[32px] border border-white/10 bg-[rgba(7,16,26,0.84)] p-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-[var(--echo-accent)]">
            Agents
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">
            Create and manage the agents your company actually needs.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-zinc-400">
            Keep support, aftercare, and installation flows separate so the docs, analytics, and
            widget setup for each one stay easy to maintain.
          </p>
        </div>
        <Link
          href="/agents/new"
          className="inline-flex items-center rounded-full bg-[var(--echo-accent)] px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-[var(--echo-accent-strong)]"
        >
          <Plus className="mr-2 size-4" />
          New agent
        </Link>
      </div>

      <div className="grid gap-4">
        {agents.items.map((agent) => (
          <Link
            key={agent.id}
            href={`/agents/${agent.id}`}
            className="grid gap-4 rounded-[28px] border border-white/10 bg-[rgba(7,16,26,0.84)] p-6 transition duration-300 hover:-translate-y-0.5 hover:border-white/16 hover:bg-[rgba(10,18,30,0.92)] lg:grid-cols-[1fr_auto_auto_auto]"
          >
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold text-white">{agent.name}</h3>
                <span
                  className={`rounded-full px-3 py-1 text-xs ${
                    agent.isActive
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "bg-zinc-700/40 text-zinc-300"
                  }`}
                >
                  {agent.isActive ? "active" : "paused"}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-500">{agent.publicAgentKey}</p>
            </div>
            <div className="text-sm text-zinc-300">{agent.documentCount} docs</div>
            <div className="text-sm text-zinc-300">{agent.conversationCount} conversations</div>
            <div className="flex items-center text-sm text-[var(--echo-accent)]">
              Open
              <ArrowRight className="ml-2 size-4" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
