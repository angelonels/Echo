import Link from "next/link"

import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard"
import {
  getAgent,
  getAnalyticsSummary,
  getConversationSummaries,
  getTopQuestions,
} from "@/lib/api/echo"

export default async function AgentAnalyticsPage({
  params,
}: {
  params: { agentId: string }
}) {
  const { agentId } = params
  const [agent, summary, questions, conversations] = await Promise.all([
    getAgent(agentId),
    getAnalyticsSummary(agentId),
    getTopQuestions(agentId),
    getConversationSummaries(agentId),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[32px] border border-white/10 bg-[rgba(7,16,26,0.84)] p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-[var(--echo-accent)]">
            Analytics
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">
            Watch how {agent.name} performs under real traffic.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-zinc-400">
            Use fallback rate, sentiment, and question volume to find where the knowledge base is
            strong and where the agent needs better material.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/agents/${agentId}/playground`}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
          >
            Playground
          </Link>
          <Link
            href={`/agents/${agentId}/widget`}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
          >
            Widget
          </Link>
        </div>
      </div>

      <AnalyticsDashboard
        summary={summary}
        questions={questions.items}
        conversations={conversations.items}
      />
    </div>
  )
}
