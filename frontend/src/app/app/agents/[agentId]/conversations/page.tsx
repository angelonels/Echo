import { AgentWorkspaceNav } from "@/components/agents/agent-workspace-nav"
import { getAgent, getConversationSummaries } from "@/lib/api/echo"

export default async function AgentConversationsPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params
  const [agent, conversations] = await Promise.all([getAgent(agentId), getConversationSummaries(agentId)])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Conversations</h2>
          <p className="mt-2 text-muted-foreground">Review playground and widget sessions for {agent.name}.</p>
        </div>
        <AgentWorkspaceNav agentId={agentId} current="conversations" />
      </div>

      <div className="rounded-lg border border-border bg-card">
        {conversations.items.length ? (
          conversations.items.map((conversation) => (
            <div key={conversation.id} className="flex items-center justify-between border-b border-border p-4 last:border-b-0">
              <div>
                <p className="font-medium">{conversation.source.toLowerCase()} conversation</p>
                <p className="mt-1 text-sm text-muted-foreground">{conversation.messageCount} messages</p>
              </div>
              <p className="text-sm text-muted-foreground">{conversation.lastMessageAt}</p>
            </div>
          ))
        ) : (
          <div className="p-6 text-sm text-muted-foreground">No conversations yet.</div>
        )}
      </div>
    </div>
  )
}
