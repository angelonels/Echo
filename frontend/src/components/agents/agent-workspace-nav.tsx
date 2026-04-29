import Link from "next/link"
import { BarChart3, Bot, Bug, FileText, MessageSquareText, Puzzle, Settings, Wrench } from "lucide-react"

import { cn } from "@/lib/utils"

const sections = [
  { slug: "overview", label: "Overview", icon: Bot },
  { slug: "knowledge", label: "Knowledge", icon: FileText },
  { slug: "playground", label: "Playground", icon: MessageSquareText },
  { slug: "conversations", label: "Conversations", icon: MessageSquareText },
  { slug: "analytics", label: "Analytics", icon: BarChart3 },
  { slug: "knowledge-gaps", label: "Knowledge Gaps", icon: Puzzle },
  { slug: "traces", label: "Traces", icon: Bug },
  { slug: "widget", label: "Widget", icon: Wrench },
  { slug: "settings", label: "Settings", icon: Settings },
] as const

export function AgentWorkspaceNav({
  agentId,
  current,
}: {
  agentId: string
  current: (typeof sections)[number]["slug"]
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {sections.map((section) => {
        const Icon = section.icon
        const href =
          section.slug === "overview" ? `/app/agents/${agentId}` : `/app/agents/${agentId}/${section.slug}`

        return (
          <Link
            key={section.slug}
            href={href}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition",
              current === section.slug
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-secondary"
            )}
          >
            <Icon className="size-3.5" />
            {section.label}
          </Link>
        )
      })}
    </div>
  )
}
