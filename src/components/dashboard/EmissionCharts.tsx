"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, Cell, XAxis, YAxis, ResponsiveContainer } from "recharts"

interface ChartData {
  name: string
  value: number
  emissions?: number
}

interface EmissionChartsProps {
  categoryData: ChartData[]
  timelineData: ChartData[]
  totalEmissions: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export function EmissionCharts({ categoryData, timelineData, totalEmissions }: EmissionChartsProps) {
  const chartConfig = {
    emissions: {
      label: "CO2 Emissions",
      color: "hsl(var(--chart-1))",
    },
    value: {
      label: "Value",
      color: "hsl(142, 76%, 36%)",
    },
  }

  // Check if we have data
  const hasCategories = categoryData && categoryData.length > 0
  const hasTimeline = timelineData && timelineData.length > 0

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Emissions by Category</CardTitle>
          <CardDescription>Distribution of your carbon footprint</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px]">
          {!hasCategories ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No emission data yet. Start by adding your first emission!</p>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="40%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={60}
                  formatter={(value, entry: any) => {
                    const item = categoryData.find(d => d.name === value)
                    const percent = item && totalEmissions > 0 ? ((item.value / totalEmissions) * 100).toFixed(0) : 0
                    return `${value}: ${percent}%`
                  }}
                />
              </PieChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Emissions Timeline</CardTitle>
          <CardDescription>Your carbon footprint over time</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {!hasTimeline ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No timeline data available yet</p>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-full w-full">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--foreground)" />
                  <YAxis stroke="var(--foreground)" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="emissions" 
                  stroke="hsl(142, 76%, 36%)" 
                  strokeWidth={4}
                  name="CO2 (kg)"
                  dot={{ fill: "hsl(142, 76%, 36%)", stroke: "hsl(var(--background))", strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, fill: "hsl(142, 76%, 36%)", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                  connectNulls={true}
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Monthly Comparison</CardTitle>
          <CardDescription>Compare your emissions month by month</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px]">
          {!hasTimeline ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No monthly data available yet</p>
            </div>
          ) : (
              <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart data={timelineData} margin={{ bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis 
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tick={{ fontSize: 12 }}
                    stroke="var(--foreground)"
                  />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--foreground)" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="emissions" fill="hsl(142, 76%, 36%)" name="CO2 Emissions (kg)" />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}