import { Activity, MessageSquare, ShieldCheck, TrendingDown } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

export function VolumeStatCards({
  sentiment,
  interactions,
  fallbackRate,
  totalConversations,
}: {
  sentiment: number
  interactions?: number
  fallbackRate: number
  totalConversations: number
}) {
  const cards = [
    {
      label: "Total conversations",
      value: totalConversations.toLocaleString(),
      caption: "Across the selected support agent",
      icon: MessageSquare,
      tone: "text-[var(--echo-accent)] bg-[rgba(17,181,164,0.12)]",
    },
    {
      label: "Messages analyzed",
      value: (interactions ?? 0).toLocaleString(),
      caption: "Playground and widget traffic combined",
      icon: Activity,
      tone: "text-sky-300 bg-sky-400/10",
    },
    {
      label: "Average confidence",
      value: sentiment.toFixed(2),
      caption: "Healthy responses stay above 0.80",
      icon: ShieldCheck,
      tone: "text-emerald-300 bg-emerald-400/10",
    },
    {
      label: "Fallback rate",
      value: `${Math.round(fallbackRate * 100)}%`,
      caption: "Track handoff risk before rollout",
      icon: TrendingDown,
      tone: "text-amber-200 bg-amber-400/10",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.label} className="border-white/10 bg-[rgba(7,16,26,0.84)]">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-zinc-500">{card.label}</p>
                  <p className="text-3xl font-bold tracking-tight text-zinc-100">{card.value}</p>
                  <p className="text-xs text-zinc-500">{card.caption}</p>
                </div>
                <div className={`rounded-2xl p-3 ${card.tone}`}>
                  <Icon className="size-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
