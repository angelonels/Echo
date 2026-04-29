import { AgentWorkspaceNav } from "@/components/agents/agent-workspace-nav"
import { getAgent } from "@/lib/api/echo"

export default async function AgentKnowledgeGapsPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params
  const agent = await getAgent(agentId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Knowledge Gaps</h2>
          <p className="mt-2 text-muted-foreground">Repeated low-confidence topics and missing documentation for {agent.name}.</p>
        </div>
        <AgentWorkspaceNav agentId={agentId} current="knowledge-gaps" />
      </div>

      <div className="rounded-lg border border-dashed border-border bg-card p-8 text-sm text-muted-foreground">
        Gap event creation and clustering start in Phase 6. The route and Module are ready.
      </div>
    </div>
  )
}
