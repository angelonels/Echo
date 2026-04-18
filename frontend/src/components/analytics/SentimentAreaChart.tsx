"use client"

import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartConfig = {
  sentiment: {
    label: "Avg Sentiment",
    color: "#34d399", // emerald-400
  },
} satisfies ChartConfig

export function SentimentAreaChart({ data }: { data: { time: string, sentiment: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <Card className="bg-zinc-900 border-zinc-800 flex flex-col items-center justify-center h-[350px]">
        <p className="text-sm text-zinc-500">No timeline data available.</p>
      </Card>
    )
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-zinc-100">Sentiment Timeline</CardTitle>
        <CardDescription className="text-zinc-500">Average sentiment rolling over 24-hr windows</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
          <AreaChart accessibilityLayer data={data} margin={{ left: 0, right: 0, top: 10 }}>
            <defs>
              <linearGradient id="fillSentiment" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-sentiment)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-sentiment)" stopOpacity={0.0} />
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
            <YAxis hide domain={[-1, 1]} />
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
