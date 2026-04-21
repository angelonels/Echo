"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartConfig = {
  sentiment: {
    label: "Conversations",
    color: "#34d399",
  },
} satisfies ChartConfig

export function SentimentAreaChart({
  data,
  total,
}: {
  data: { time: string; sentiment: number }[]
  total: number
}) {
  if (!data || data.length === 0) {
    return (
      <Card className="flex h-[350px] flex-col items-center justify-center border-white/10 bg-[rgba(7,16,26,0.84)]">
        <p className="text-sm text-zinc-500">No timeline data available.</p>
      </Card>
    )
  }

  return (
    <Card className="border-white/10 bg-[rgba(7,16,26,0.84)]">
      <CardHeader>
        <CardTitle className="text-zinc-100">Sentiment distribution</CardTitle>
        <CardDescription className="text-zinc-500">
          {total} conversations bucketed by outcome sentiment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
          <AreaChart accessibilityLayer data={data} margin={{ left: 0, right: 0, top: 10 }}>
            <defs>
              <linearGradient id="fillSentiment" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-sentiment)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-sentiment)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
            />
            <YAxis hide />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            <Area
              type="monotone"
              dataKey="sentiment"
              stroke="var(--color-sentiment)"
              fillOpacity={1}
              fill="url(#fillSentiment)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
