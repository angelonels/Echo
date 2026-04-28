import { redirect } from "next/navigation"

export default function LegacyNewAgentPage() {
  redirect("/app/agents/new")
}
