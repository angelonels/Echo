import Link from "next/link"
import { Copy, FileText, MessageSquareText, Settings2 } from "lucide-react"

import { AgentForm } from "@/components/agents/agent-form"
import { AgentWorkspaceNav } from "@/components/agents/agent-workspace-nav"
import { getAgent, getAgentDocuments } from "@/lib/api/echo"

export default async function AgentOverviewPage({
  params,
}: {
  params: Promise<{ agentId: string }>
}) {
  const { agentId } = await params
  const [agent, documents] = await Promise.all([getAgent(agentId), getAgentDocuments(agentId)])
  const readyDocuments = documents.items.filter((document) => document.status === "ready").length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">{agent.name}</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">{agent.description}</p>
        </div>
        <AgentWorkspaceNav agentId={agentId} current="overview" />
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Stat icon={Settings2} label="Status" value={agent.status} />
        <Stat icon={FileText} label="Documents ready" value={`${readyDocuments}/${documents.items.length}`} />
        <Stat icon={MessageSquareText} label="Conversations" value={agent.conversationCount.toString()} />
        <Stat icon={Copy} label="Public key" value={agent.publicAgentKey} compact />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.86fr]">
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-semibold">Agent configuration</h3>
          <div className="mt-6">
            <AgentForm initialValues={agent} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-lg font-semibold">Launch checklist</h3>
            <div className="mt-5 space-y-3">
              {[
                ["Upload knowledge", documents.items.length > 0, `/app/agents/${agentId}/knowledge`],
                ["Wait for ready chunks", readyDocuments > 0, `/app/agents/${agentId}/knowledge`],
                ["Ask playground questions", agent.conversationCount > 0, `/app/agents/${agentId}/playground`],
              ].map(([label, done, href]) => (
                <Link key={String(label)} href={String(href)} className="flex items-center justify-between rounded-md border border-border bg-background px-4 py-3 text-sm">
                  <span>{label}</span>
                  <span className={done ? "text-primary" : "text-muted-foreground"}>{done ? "Done" : "Open"}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-secondary p-6">
            <h3 className="text-lg font-semibold">Embed comes later</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Phase 4 will activate the public widget endpoints. Phase 3 focuses on grounding quality inside the playground.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  compact,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  compact?: boolean
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <Icon className="size-5 text-primary" />
      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
      <p className={compact ? "mt-1 break-all text-sm font-semibold" : "mt-1 text-2xl font-semibold"}>{value}</p>
    </div>
  )
}
