import { AgentForm } from "@/components/agents/agent-form"
import { AgentWorkspaceNav } from "@/components/agents/agent-workspace-nav"
import { getAgent } from "@/lib/api/echo"

export default async function AgentSettingsPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params
  const agent = await getAgent(agentId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Settings</h2>
          <p className="mt-2 text-muted-foreground">Agent defaults, model settings, retrieval mode, and fallback behavior.</p>
        </div>
        <AgentWorkspaceNav agentId={agentId} current="settings" />
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <AgentForm initialValues={agent} />
      </div>
    </div>
  )
}
