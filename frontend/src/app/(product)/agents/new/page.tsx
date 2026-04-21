import { AgentForm } from "@/components/agents/agent-form"

export default function NewAgentPage() {
  return (
    <div className="rounded-[32px] border border-white/10 bg-[rgba(7,16,26,0.84)] p-8">
      <p className="text-xs uppercase tracking-[0.32em] text-[var(--echo-accent)]">
        New agent
      </p>
      <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">
        Create an agent your team can launch with confidence.
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-8 text-zinc-400">
        Define its purpose, greeting, visual identity, and launcher behavior before uploading
        documents or testing in the playground.
      </p>
      <div className="mt-8">
        <AgentForm />
      </div>
    </div>
  )
}
