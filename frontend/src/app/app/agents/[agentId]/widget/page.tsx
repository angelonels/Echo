import { AgentWorkspaceNav } from "@/components/agents/agent-workspace-nav"
import { getAgent } from "@/lib/api/echo"

export default async function AgentWidgetPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params
  const agent = await getAgent(agentId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Widget</h2>
          <p className="mt-2 text-muted-foreground">Embed setup, allowed domains, theme, and preview for {agent.name}.</p>
        </div>
        <AgentWorkspaceNav agentId={agentId} current="widget" />
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">Public key</p>
        <code className="mt-2 block break-all rounded-md bg-secondary p-3 text-sm">{agent.publicAgentKey}</code>
      </div>
    </div>
  )
}
