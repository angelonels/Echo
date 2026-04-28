import { redirect } from "next/navigation"

export default async function LegacyAgentPage({
  params,
}: {
  params: Promise<{ agentId: string }>
}) {
  const { agentId } = await params
  redirect(`/app/agents/${agentId}`)
}
