"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Users } from "lucide-react"

interface ComparisonData {
  name: string
  emissions: number
  avatar?: string
}

interface ComparisonChartProps {
  userData: ComparisonData
  averageData: ComparisonData
  topPerformerData: ComparisonData
}

export function ComparisonChart({ userData, averageData, topPerformerData }: ComparisonChartProps) {
  const maxEmissions = Math.max(userData.emissions, averageData.emissions, topPerformerData.emissions)

  const getPercentage = (emissions: number) => {
    return (emissions / maxEmissions) * 100
  }

  const getComparisonText = () => {
    const diff = userData.emissions - averageData.emissions
    const percentage = Math.abs((diff / averageData.emissions) * 100).toFixed(0)
    
    if (diff > 0) {
      return {
        text: `${percentage}% above average`,
        color: "text-red-500"
      }
    } else if (diff < 0) {
      return {
        text: `${percentage}% below average`,
        color: "text-green-500"
      }
    }
    return {
      text: "At average",
      color: "text-blue-500"
    }
  }

  const comparison = getComparisonText()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compare Your Impact</CardTitle>
        <CardDescription>See how you stack up against others</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>You</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">Your Emissions</p>
                <p className="text-sm text-muted-foreground">
                  {userData.emissions.toFixed(1)} kg CO2
                </p>
              </div>
            </div>
            <span className={`text-sm font-semibold ${comparison.color}`}>
              {comparison.text}
            </span>
          </div>
          <Progress value={getPercentage(userData.emissions)} className="h-3" />
        </div>

        {/* Average Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="bg-blue-100 dark:bg-blue-900">
                <AvatarFallback>
                  <Users className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">Community Average</p>
                <p className="text-sm text-muted-foreground">
                  {averageData.emissions.toFixed(1)} kg CO2
                </p>
              </div>
            </div>
          </div>
          <Progress value={getPercentage(averageData.emissions)} className="h-3 [&>div]:bg-blue-500" />
        </div>

        {/* Top Performer Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="bg-green-100 dark:bg-green-900">
                <AvatarFallback className="text-green-600">🏆</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">Top Performer</p>
                <p className="text-sm text-muted-foreground">
                  {topPerformerData.emissions.toFixed(1)} kg CO2
                </p>
              </div>
            </div>
          </div>
          <Progress value={getPercentage(topPerformerData.emissions)} className="h-3 [&>div]:bg-green-500" />
        </div>

        {/* Insights */}
        <div className="p-4 rounded-lg bg-muted/50 border">
          <p className="text-sm">
            {userData.emissions > averageData.emissions ? (
              <>
                💡 <strong>Tip:</strong> You can reduce your footprint by {((userData.emissions - topPerformerData.emissions) / userData.emissions * 100).toFixed(0)}% 
                to match the top performer in your category.
              </>
            ) : (
              <>
                🎉 <strong>Great job!</strong> You&apos;re doing better than average! 
                Keep up the good work and inspire others.
              </>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}