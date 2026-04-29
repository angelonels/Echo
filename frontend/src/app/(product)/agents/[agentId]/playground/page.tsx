import { redirect } from "next/navigation"

export default async function LegacyPlaygroundPage({
  params,
}: {
  params: Promise<{ agentId: string }>
}) {
  const { agentId } = await params
  redirect(`/app/agents/${agentId}/playground`)
}
