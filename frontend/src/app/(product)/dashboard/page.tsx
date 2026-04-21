import Link from "next/link"
import { Bot, FileStack, MessagesSquare, ShieldCheck } from "lucide-react"

import { getDashboardSnapshot } from "@/lib/api/echo"

export default async function DashboardPage() {
  const { agents, summary, company } = await getDashboardSnapshot()
  const totalDocuments = agents.items.reduce((total, agent) => total + agent.documentCount, 0)
  const totalConversations = agents.items.reduce(
    (total, agent) => total + agent.conversationCount,
    0
  )
  const stats = [
    {
      label: "Active agents",
      value: agents.items.filter((item) => item.isActive).length.toString(),
      icon: Bot,
    },
    { label: "Documents", value: totalDocuments.toString(), icon: FileStack },
    { label: "Conversations", value: totalConversations.toString(), icon: MessagesSquare },
    { label: "Avg confidence", value: summary.avgConfidence.toFixed(2), icon: ShieldCheck },
  ]

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <div className="rounded-[32px] border border-white/10 bg-[rgba(7,16,26,0.84)] p-8">
          <p className="text-xs uppercase tracking-[0.32em] text-[var(--echo-accent)]">
            Workspace overview
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">
            {company.name} has everything in one place.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-zinc-400">
            Manage agents, documents, analytics, and rollout from a single view. Create as many
            agents as the company needs and tune each one for a specific support surface.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/agents"
              className="inline-flex items-center rounded-full border border-white/10 px-5 py-3 text-sm text-zinc-200 transition hover:bg-white/5"
            >
              View agents
            </Link>
            <Link
              href="/agents/new"
              className="inline-flex items-center rounded-full bg-[var(--echo-accent)] px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-[var(--echo-accent-strong)]"
            >
              Create another agent
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          {stats.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className="rounded-[28px] border border-white/10 bg-[rgba(7,16,26,0.84)] p-5 transition duration-300 hover:-translate-y-1 hover:border-white/16"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500">{item.label}</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{item.value}</p>
                  </div>
                  <div className="rounded-2xl bg-white/6 p-3 text-[var(--echo-accent)]">
                    <Icon className="size-5" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="rounded-[32px] border border-white/10 bg-[rgba(7,16,26,0.84)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">Agents</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Each agent keeps its own documents, analytics, and widget setup.
              </p>
            </div>
            <Link href="/agents" className="text-sm text-[var(--echo-accent)]">
              View all
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {agents.items.map((agent) => (
              <Link
                key={agent.id}
                href={`/agents/${agent.id}`}
                className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-white/5 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-white/16 hover:bg-white/6 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-white">{agent.name}</p>
                  <p className="mt-1 text-xs text-zinc-500">{agent.publicAgentKey}</p>
                </div>
                <div className="flex gap-4 text-sm text-zinc-300">
                  <span>{agent.documentCount} docs</span>
                  <span>{agent.conversationCount} conversations</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-[rgba(7,16,26,0.84)] p-6">
          <h3 className="text-xl font-semibold text-white">Launch checklist</h3>
          <div className="mt-5 space-y-3">
            {[
              "Finalize greeting message and launcher placement.",
              "Upload your current warranty, support, and scheduling docs.",
              "Test top intents in playground and review confidence.",
              "Whitelist production domains and copy the widget embed snippet.",
            ].map((item, index) => (
              <div
                key={item}
                className="flex gap-4 rounded-2xl border border-white/8 bg-white/5 p-4"
              >
                <div className="flex size-9 items-center justify-center rounded-2xl bg-[var(--echo-accent)] text-sm font-semibold text-slate-950">
                  0{index + 1}
                </div>
                <p className="pt-1 text-sm leading-7 text-zinc-300">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
