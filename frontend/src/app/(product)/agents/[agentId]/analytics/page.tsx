import { redirect } from "next/navigation"

export default async function LegacyAnalyticsPage({
  params,
}: {
  params: Promise<{ agentId: string }>
}) {
  const { agentId } = await params
  redirect(`/app/agents/${agentId}`)
}
