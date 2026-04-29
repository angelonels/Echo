import { AgentWorkspaceNav } from "@/components/agents/agent-workspace-nav"
import { IngestionDropzone } from "@/components/IngestionDropzone"
import { getAgent, getAgentDocuments } from "@/lib/api/echo"

export default async function AgentKnowledgePage({
  params,
}: {
  params: Promise<{ agentId: string }>
}) {
  const { agentId } = await params
  const [agent, documents] = await Promise.all([getAgent(agentId), getAgentDocuments(agentId)])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Knowledge</h2>
          <p className="mt-2 text-muted-foreground">
            Upload PDF, Markdown, TXT, or DOCX files for {agent.name}. Processing stages are visible here.
          </p>
        </div>
        <AgentWorkspaceNav agentId={agentId} current="knowledge" />
      </div>
      <IngestionDropzone agentId={agentId} documents={documents.items} />
    </div>
  )
}
