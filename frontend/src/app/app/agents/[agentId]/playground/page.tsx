import { AgentWorkspaceNav } from "@/components/agents/agent-workspace-nav"
import { PlaygroundWorkspace } from "@/components/playground/playground-workspace"
import { getAgent, getPlaygroundConversation } from "@/lib/api/echo"

export default async function PlaygroundPage({
  params,
}: {
  params: Promise<{ agentId: string }>
}) {
  const { agentId } = await params
  const [agent, conversation] = await Promise.all([
    getAgent(agentId),
    getPlaygroundConversation(agentId),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Playground</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Test customer questions and inspect sources, trace metadata, prompts, and metrics before publishing.
          </p>
        </div>
        <AgentWorkspaceNav agentId={agentId} current="playground" />
      </div>

      <PlaygroundWorkspace
        agentId={agentId}
        agentName={agent.name}
        conversation={conversation}
      />
    </div>
  )
}
