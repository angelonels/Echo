import Link from "next/link"
import { Plus } from "lucide-react"

import { getAgents } from "@/lib/api/echo"

export default async function AgentsPage() {
  const agents = await getAgents()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Agents</h2>
          <p className="mt-2 text-muted-foreground">Each agent owns its docs, traces, and playground history.</p>
        </div>
        <Link
          href="/app/agents/new"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="size-4" />
          New agent
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {agents.items.map((agent) => (
          <Link key={agent.id} href={`/app/agents/${agent.id}`} className="rounded-lg border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">{agent.name}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{agent.description}</p>
              </div>
              <span className="rounded-md bg-secondary px-2 py-1 text-xs">{agent.status}</span>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Docs</p>
                <p className="font-semibold">{agent.documentCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Chats</p>
                <p className="font-semibold">{agent.conversationCount}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
