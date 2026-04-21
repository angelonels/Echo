import Link from "next/link"

import { PlaygroundWorkspace } from "@/components/playground/playground-workspace"
import { getAgent, getPlaygroundConversation } from "@/lib/api/echo"

export default async function PlaygroundPage({
  params,
}: {
  params: { agentId: string }
}) {
  const { agentId } = params
  const [agent, conversation] = await Promise.all([
    getAgent(agentId),
    getPlaygroundConversation(agentId),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[32px] border border-white/10 bg-[rgba(7,16,26,0.84)] p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-[var(--echo-accent)]">
            Playground
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">
            Test {agent.name} before customers see it.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-zinc-400">
            Ask the highest-risk support questions, inspect retrieval confidence, and verify the
            fallback path before you expose the widget publicly.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/agents/${agentId}`}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
          >
            Config
          </Link>
          <Link
            href={`/agents/${agentId}/analytics`}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
          >
            Analytics
          </Link>
        </div>
      </div>

      <PlaygroundWorkspace
        agentId={agentId}
        agentName={agent.name}
        conversation={conversation}
      />
    </div>
  )
}
