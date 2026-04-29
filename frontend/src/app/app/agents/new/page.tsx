import { AgentForm } from "@/components/agents/agent-form"

export default function NewAgentPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">Create an agent</h2>
        <p className="mt-2 text-muted-foreground">
          Start with the support scope, fallback behavior, and retrieval defaults. Documents come next.
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <AgentForm />
      </div>
    </div>
  )
}
