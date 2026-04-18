"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartConfig = {
  count: {
    label: "Frequency",
    color: "#6366f1", // indigo-500
  },
} satisfies ChartConfig

export function FrictionBarList({ data }: { data: { name: string, count: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <Card className="bg-zinc-900 border-zinc-800 flex flex-col items-center justify-center h-[350px]">
        <p className="text-sm text-zinc-500">No friction data available for today.</p>
      </Card>
    )
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-zinc-100">Top Global Friction Points</CardTitle>
        <CardDescription className="text-zinc-500">Issues aggregated dynamically by Map-Reduce worker</CardDescription>
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
