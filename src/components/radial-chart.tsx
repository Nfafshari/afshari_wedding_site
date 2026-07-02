"use client";

import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";

import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart"


const chartData = [
  { browser: "Safari", visitors: 5, fill: "var(--olivine)" },
]

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  safari: {
    label: "Safari",
    color: "var(--foreground)",
  },
} satisfies ChartConfig

export default function RadialChart() {
  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square min-h-31.25"
    >
      <RadialBarChart
        data={chartData}
        startAngle={90}
        endAngle={270}
        outerRadius={55}
        innerRadius={45}
      >
        <PolarGrid
          gridType="circle"
          radialLines={false}
          stroke="none"
          className="first:fill-olivine/15 last:fill-background"
          polarRadius={[55, 45]}
        />
        <RadialBar dataKey="visitors" background cornerRadius={2} />
        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy - 5}
                      className="fill-burg text-xl font-bold"
                    >
                      {chartData[0].visitors.toLocaleString()} of 10
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 15}
                      className="fill-burg/70"
                    >
                      Tasks Done
                    </tspan>
                  </text>
                )
              }
            }}
          />
        </PolarRadiusAxis>
      </RadialBarChart>
    </ChartContainer>
  );
}