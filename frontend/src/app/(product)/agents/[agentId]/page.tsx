import Link from "next/link"

import { AgentForm } from "@/components/agents/agent-form"
import { IngestionDropzone } from "@/components/IngestionDropzone"
import { getAgent, getAgentDocuments } from "@/lib/api/echo"

function AgentTabs({ agentId }: { agentId: string }) {
  const tabs = [
    { href: `/agents/${agentId}`, label: "Config" },
    { href: `/agents/${agentId}/playground`, label: "Playground" },
    { href: `/agents/${agentId}/analytics`, label: "Analytics" },
    { href: `/agents/${agentId}/widget`, label: "Widget" },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`rounded-full px-4 py-2 text-sm ${
            tab.label === "Config"
              ? "bg-[var(--echo-accent)] text-slate-950"
              : "border border-white/10 text-zinc-300 hover:bg-white/5"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}

export default async function AgentDetailPage({
  params,
}: {
  params: { agentId: string }
}) {
  const { agentId } = params
  const [agent, documents] = await Promise.all([
    getAgent(agentId),
    getAgentDocuments(agentId),
  ])

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[rgba(7,16,26,0.84)] p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-[var(--echo-accent)]">
              Agent config
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">
              {agent.name}
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-8 text-zinc-400">
              Edit the agent profile, greeting, and launcher settings. Uploads and live route
              testing stay directly attached to this agent.
            </p>
          </div>
          <AgentTabs agentId={agentId} />
        </div>

        <div className="mt-8">
          <AgentForm initialValues={agent} />
        </div>
      </section>

      <IngestionDropzone agentId={agentId} documents={documents.items} />
    </div>
  )
}
