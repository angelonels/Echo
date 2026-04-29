import { AgentWorkspaceNav } from "@/components/agents/agent-workspace-nav"
import { getAgent } from "@/lib/api/echo"

export default async function AgentTracesPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params
  const agent = await getAgent(agentId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Traces</h2>
          <p className="mt-2 text-muted-foreground">Inspect retrieval, confidence, warnings, latency, and citations for {agent.name}.</p>
        </div>
        <AgentWorkspaceNav agentId={agentId} current="traces" />
      </div>

      <div className="rounded-lg border border-dashed border-border bg-card p-8 text-sm text-muted-foreground">
        Trace persistence is active in Phase 3. Trace list filters and detail views are prepared for Phase 5.
      </div>
    </div>
  )
}
