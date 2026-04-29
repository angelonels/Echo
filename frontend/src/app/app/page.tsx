import Link from "next/link"
import { ArrowRight, Robot, FileText, ChatCenteredText, ShieldCheck } from "@phosphor-icons/react/dist/ssr"

import { getAgents } from "@/lib/api/echo"

export default async function AppDashboardPage() {
  const agents = await getAgents()
  const totalDocuments = agents.items.reduce((sum, agent) => sum + agent.documentCount, 0)
  const totalConversations = agents.items.reduce((sum, agent) => sum + agent.conversationCount, 0)

  return (
    <div className="space-y-8 max-w-6xl">
      <section className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="relative overflow-hidden rounded-[2rem] border border-[#2c2118]/10 bg-[#fffaf0]/80 p-8 shadow-[0_24px_80px_-60px_rgba(70,52,33,0.3)]">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(15,118,110,0.08),transparent_50%)] pointer-events-none" />
          
          <div className="relative">
            <h2 className="max-w-3xl text-3xl font-semibold tracking-[-0.02em] text-[#18140f] md:text-5xl leading-[1.1]">
              Build a support chatbot from your docs.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#6d604f]">
              Create an agent, upload support material, then use the playground to verify grounded
              answers, citations, confidence, and traces before the public widget ships.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/app/agents/new"
                className="group inline-flex h-12 items-center gap-3 rounded-full bg-[#18140f] px-6 text-sm font-semibold text-[#fffaf0] transition-all duration-500 hover:bg-[#0f766e] active:scale-[0.985] shadow-[0_4px_14px_0_rgba(24,20,15,0.25)] hover:shadow-[0_6px_20px_rgba(15,118,110,0.35)]"
              >
                Create agent
                <ArrowRight size={16} weight="bold" className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/app/agents"
                className="inline-flex h-12 items-center justify-center rounded-full border border-[#2c2118]/15 bg-[#fffaf0] px-6 text-sm font-semibold text-[#31271d] transition-all duration-300 hover:bg-[#fbf4e7]"
              >
                View agents
              </Link>
            </div>
          </div>
        </div>
        
        <div className="rounded-[2rem] border border-[#2c2118]/10 bg-[#fbf4e7] p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)]">
          <p className="text-sm font-semibold text-[#18140f]">Phase coverage</p>
          <div className="mt-6 space-y-5 text-sm text-[#5f5245]">
            {[
              "Clerk-owned resources",
              "Document ingestion",
              "Playground RAG with citations",
              "Trace metadata capture",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <ShieldCheck size={20} weight="duotone" className="text-[#0f766e]" />
                <span className="font-medium text-[#31271d]">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-3">
        <Metric icon={Robot} label="Agents" value={agents.items.length.toString()} />
        <Metric icon={FileText} label="Documents" value={totalDocuments.toString()} />
        <Metric icon={ChatCenteredText} label="Conversations" value={totalConversations.toString()} />
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-[#2c2118]/10 bg-[#fffaf0] shadow-sm">
        <div className="border-b border-[#2c2118]/10 bg-[#fbf4e7]/50 px-6 py-5">
          <h3 className="text-lg font-semibold text-[#18140f]">Recent agents</h3>
        </div>
        <div className="divide-y divide-[#2c2118]/5">
          {agents.items.length ? (
            agents.items.slice(0, 5).map((agent) => (
              <Link
                key={agent.id}
                href={`/app/agents/${agent.id}`}
                className="group flex flex-col gap-3 px-6 py-5 transition-colors duration-300 hover:bg-[#fbf4e7]/70 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold text-[#18140f] group-hover:text-[#0f766e] transition-colors">{agent.name}</p>
                  <p className="mt-1.5 flex items-center gap-2 text-xs font-medium text-[#817464]">
                    <span className="flex items-center gap-1.5"><FileText size={14} /> {agent.documentCount} docs</span>
                    <span className="h-1 w-1 rounded-full bg-[#2c2118]/20" />
                    <span className="flex items-center gap-1.5"><ChatCenteredText size={14} /> {agent.conversationCount} conversations</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#0f766e]/15 bg-[#0f766e]/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#0f766e]">
                    <span className="size-1.5 rounded-full bg-[#0f766e]" />
                    Ready
                  </span>
                  <ArrowRight size={16} className="text-[#817464] opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 hidden md:block" />
                </div>
              </Link>
            ))
          ) : (
            <div className="p-10 text-center">
              <div className="mx-auto grid size-16 place-items-center rounded-2xl border border-[#2c2118]/10 bg-[#fbf4e7]">
                <Robot size={28} weight="duotone" className="text-[#817464]" />
              </div>
              <p className="mt-5 text-sm font-medium text-[#31271d]">No agents yet</p>
              <p className="mt-2 text-xs text-[#817464]">Create your first support agent to get started.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string, weight?: string, size?: number }>
  label: string
  value: string
}) {
  return (
    <div className="group rounded-[1.6rem] border border-[#2c2118]/10 bg-[#fffaf0]/80 p-6 transition-all duration-300 hover:shadow-[0_12px_32px_-16px_rgba(70,52,33,0.15)] hover:border-[#2c2118]/15">
      <div className="grid size-12 place-items-center rounded-xl border border-[#0f766e]/16 bg-[#0f766e]/8 transition-colors duration-300 group-hover:bg-[#0f766e]/12">
        <Icon size={24} weight="duotone" className="text-[#0f766e]" />
      </div>
      <p className="mt-6 text-sm font-medium text-[#6d604f]">{label}</p>
      <p className="mt-2 font-mono text-4xl font-semibold text-[#18140f]">{value}</p>
    </div>
  )
}
