import { AgentWorkspaceNav } from "@/components/agents/agent-workspace-nav"
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard"
import { getAgent, getAnalyticsSummary, getConversationSummaries, getTopQuestions } from "@/lib/api/echo"

export default async function AgentAnalyticsPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params
  const [agent, summary, topQuestions, conversations] = await Promise.all([
    getAgent(agentId),
    getAnalyticsSummary(agentId),
    getTopQuestions(agentId),
    getConversationSummaries(agentId),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Analytics</h2>
          <p className="mt-2 text-muted-foreground">Direct-query quality metrics for {agent.name}.</p>
        </div>
        <AgentWorkspaceNav agentId={agentId} current="analytics" />
      </div>

      <AnalyticsDashboard summary={summary} questions={topQuestions.items} conversations={conversations.items} />
    </div>
  )
}
