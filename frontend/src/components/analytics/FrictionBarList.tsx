"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartConfig = {
  count: {
    label: "Frequency",
    color: "#11b5a4",
  },
} satisfies ChartConfig

export function FrictionBarList({ data }: { data: { name: string; count: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <Card className="flex h-[350px] flex-col items-center justify-center border-white/10 bg-[rgba(7,16,26,0.84)]">
        <p className="text-sm text-zinc-500">No friction data available for today.</p>
      </Card>
    )
  }

  return (
    <Card className="border-white/10 bg-[rgba(7,16,26,0.84)]">
      <CardHeader>
        <CardTitle className="text-zinc-100">Top repeated questions</CardTitle>
        <CardDescription className="text-zinc-500">
          High-volume intents that should inform doc updates and agent tuning
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
          <BarChart accessibilityLayer data={data} layout="vertical" margin={{ left: 0, right: 0 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#27272a" />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
              width={160}
            />
            <XAxis dataKey="count" type="number" hide />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
