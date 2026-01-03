"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingDown, 
  TrendingUp, 
  Lightbulb, 
  Target, 
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Share2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface Insight {
  id: string
  type: "success" | "warning" | "tip" | "goal"
  title: string
  description: string
  impact?: string
  actionable?: boolean
}

interface PersonalizedInsightsProps {
  userId?: string
  triggerRefresh?: number
}

export function PersonalizedInsights({ userId, triggerRefresh }: PersonalizedInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)

  useEffect(() => {
    const fetchInsights = async () => {
      if (!userId) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const token = localStorage.getItem("bearer_token")
        const response = await fetch(`/api/insights?userId=${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setInsights(data)
        }
      } catch (error) {
        console.error("Failed to fetch insights:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInsights()
  }, [userId, triggerRefresh])

  const getActionSteps = (insight: Insight) => {
    // Generate specific action steps based on insight content
    const steps: string[] = []
    
    if (insight.description.includes("transportation") || insight.description.includes("driving")) {
      steps.push(
        "Consider carpooling or using public transportation for your daily commute",
        "Switch to an electric or hybrid vehicle for your next car purchase",
        "Try biking or walking for short-distance trips under 2 miles",
        "Combine errands into a single trip to reduce total mileage"
      )
    } else if (insight.description.includes("electricity") || insight.description.includes("energy")) {
      steps.push(
        "Switch to LED bulbs throughout your home (75% less energy)",
        "Unplug electronics when not in use to eliminate phantom power draw",
        "Upgrade to Energy Star certified appliances",
        "Install a programmable thermostat to optimize heating/cooling",
        "Consider switching to a renewable energy provider"
      )
    } else if (insight.description.includes("food") || insight.description.includes("diet")) {
      steps.push(
        "Reduce meat consumption, especially beef (try Meatless Mondays)",
        "Buy local and seasonal produce to reduce transportation emissions",
        "Minimize food waste by meal planning and proper storage",
        "Start composting organic waste"
      )
    } else if (insight.description.includes("waste")) {
      steps.push(
        "Implement a comprehensive recycling system at home",
        "Switch to reusable bags, bottles, and containers",
        "Buy products with minimal or recyclable packaging",
        "Donate or sell items instead of throwing them away"
      )
    } else {
      // Generic action steps
      steps.push(
        "Track your emissions regularly to identify patterns",
        "Set monthly reduction goals and monitor progress",
        "Share your carbon reduction journey with friends and family",
        "Research and implement one new sustainable practice each month"
      )
    }
    
    return steps
  }

  const handleTakeAction = (insight: Insight) => {
    setSelectedInsight(insight)
    setActionDialogOpen(true)
  }

  const handleShareInsight = () => {
    if (!selectedInsight) return
    
    const shareText = `${selectedInsight.title}\n\n${selectedInsight.description}\n\n#CarbonTracking #Sustainability`
    
    if (navigator.share) {
      navigator.share({
        title: selectedInsight.title,
        text: shareText,
      }).catch(() => {
        // Fallback to clipboard
        navigator.clipboard.writeText(shareText)
        toast.success("Insight copied to clipboard!")
      })
    } else {
      navigator.clipboard.writeText(shareText)
      toast.success("Insight copied to clipboard!")
    }
  }

  const handleLearnMore = () => {
    // Open relevant educational resources
    const searchQuery = selectedInsight?.title.replace(/\s+/g, '+')
    window.open(`https://www.epa.gov/search?search=${searchQuery}`, '_blank')
    toast.success("Opening EPA resources in new tab")
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-orange-500" />
      case "tip":
        return <Lightbulb className="h-5 w-5 text-blue-500" />
      case "goal":
        return <Target className="h-5 w-5 text-purple-500" />
      default:
        return <Lightbulb className="h-5 w-5" />
    }
  }

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "success":
        return "default"
      case "warning":
        return "destructive"
      case "tip":
        return "secondary"
      case "goal":
        return "outline"
      default:
        return "secondary"
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Personalized Insights</CardTitle>
          <CardDescription>AI-powered recommendations based on your data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Analyzing your emissions data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Personalized Insights</CardTitle>
          <CardDescription>
            AI-powered recommendations based on your real-time data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Start tracking emissions to receive personalized insights!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getIcon(insight.type)}</div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm">{insight.title}</h3>
                        <Badge variant={getBadgeVariant(insight.type)} className="text-xs">
                          {insight.type}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {insight.description}
                      </p>
                      
                      {insight.impact && (
                        <div className="flex items-center gap-2">
                          {insight.impact.includes("-") || insight.impact.includes("Saved") ? (
                            <TrendingDown className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-orange-500" />
                          )}
                          <span className="text-xs font-semibold">{insight.impact}</span>
                        </div>
                      )}
                      
                      {insight.actionable && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => handleTakeAction(insight)}
                        >
                          Take Action
                          <ArrowRight className="ml-2 h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {selectedInsight?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedInsight?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Recommended Action Steps
              </h4>
              <ul className="space-y-2">
                {selectedInsight && getActionSteps(selectedInsight).map((step, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground pt-0.5">{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {selectedInsight?.impact && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Potential Impact: {selectedInsight.impact}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleShareInsight}
              className="w-full sm:w-auto"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button
              variant="outline"
              onClick={handleLearnMore}
              className="w-full sm:w-auto"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Learn More
            </Button>
            <Button
              onClick={() => setActionDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Got It!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}