"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { TrendingDown, TrendingUp, Leaf, Target, Plus } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "@/lib/auth-client"
import { useQuestProgress } from "@/hooks/useQuestProgress"

interface DashboardStatsProps {
  totalEmissions: number
  monthlyChange: number
  rank: number
  treesEquivalent: number
  grossEmissions?: number
  carbonOffset?: number
  onDataChange?: () => void
}

export function DashboardStats({ 
  totalEmissions, 
  monthlyChange, 
  rank, 
  treesEquivalent, 
  grossEmissions = 0,
  carbonOffset = 0,
  onDataChange 
}: DashboardStatsProps) {
  const isPositive = monthlyChange >= 0
  const { data: session } = useSession()
  const { trackProgress } = useQuestProgress(session?.user?.id)
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [treesPlanted, setTreesPlanted] = useState("")
  const [plantingDate, setPlantingDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [totalTreesPlanted, setTotalTreesPlanted] = useState(0)
  const [plantingHistory, setPlantingHistory] = useState<TreePlanting[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // Fetch total trees planted and history - now also when treesEquivalent changes
  useEffect(() => {
    const fetchTreeData = async () => {
      if (!session?.user?.id) return

      setIsLoadingHistory(true)
      try {
        const token = localStorage.getItem("bearer_token")
        
        // Fetch aggregate total
        const aggregateResponse = await fetch(
          `/api/tree-plantings?userId=${session.user.id}&aggregate=true`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        
        if (aggregateResponse.ok) {
          const data = await aggregateResponse.json()
          setTotalTreesPlanted(data.totalTreesPlanted || 0)
        }
        
        // Fetch planting history
        const historyResponse = await fetch(
          `/api/tree-plantings?userId=${session.user.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        
        if (historyResponse.ok) {
          const history = await historyResponse.json()
          setPlantingHistory(history)
        }
      } catch (error) {
        console.error("Failed to fetch tree planting data:", error)
      } finally {
        setIsLoadingHistory(false)
      }
    }

    if (isDialogOpen || treesEquivalent > 0) {
      fetchTreeData()
    }
  }, [session?.user?.id, isDialogOpen, treesEquivalent])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session?.user?.id) {
      toast.error("You must be logged in to track tree plantings")
      return
    }
    
    const treesCount = parseInt(treesPlanted)
    if (isNaN(treesCount) || treesCount <= 0) {
      toast.error("Please enter a valid number of trees")
      return
    }

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch("/api/tree-plantings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: session.user.id,
          treesPlanted: treesCount,
          plantingDate,
          notes: notes.trim() || null,
        }),
      })

      if (response.ok) {
        toast.success(`Successfully logged ${treesCount} tree${treesCount > 1 ? 's' : ''} planted!`)
        
        // Track quest progress for planting trees
        await trackProgress('plant_trees', treesCount)
        
        // Recalculate user stats first (this updates treesEquivalent)
        await fetch(`/api/user-stats?userId=${session.user.id}`)
        
        // Then recalculate leaderboard
        await fetch("/api/calculate-leaderboard", { method: "POST" })
        
        // Trigger badge refresh
        await fetch("/api/check-badges", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: session.user.id }),
        })
        
        // Trigger parent refresh to update all stats including treesEquivalent
        if (onDataChange) {
          onDataChange()
        }
        
        // Refresh local data
        const aggregateResponse = await fetch(
          `/api/tree-plantings?userId=${session.user.id}&aggregate=true`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        
        if (aggregateResponse.ok) {
          const data = await aggregateResponse.json()
          setTotalTreesPlanted(data.totalTreesPlanted || 0)
        }
        
        // Refresh history
        const historyResponse = await fetch(
          `/api/tree-plantings?userId=${session.user.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        
        if (historyResponse.ok) {
          const history = await historyResponse.json()
          setPlantingHistory(history)
        }
        
        // Reset form
        setTreesPlanted("")
        setPlantingDate(new Date().toISOString().split('T')[0])
        setNotes("")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to log tree planting")
      }
    } catch (error) {
      console.error("Failed to submit tree planting:", error)
      toast.error("Failed to log tree planting")
    } finally {
      setIsSubmitting(false)
    }
  }

  const remainingTrees = Math.max(0, treesEquivalent - totalTreesPlanted)
  const offsetPercentage = treesEquivalent > 0 
    ? Math.min(100, Math.round((totalTreesPlanted / treesEquivalent) * 100))
    : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Emissions Balance</CardTitle>
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(totalEmissions / 1000).toFixed(1)} kg</div>
            <p className="text-xs text-muted-foreground">After {(carbonOffset / 1000).toFixed(1)} kg offset</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(grossEmissions / 1000).toFixed(1)} kg</div>
            <p className="text-xs text-muted-foreground">Total logged CO2</p>
          </CardContent>
        </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Change</CardTitle>
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-red-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-green-500" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isPositive ? 'text-red-500' : 'text-green-500'}`}>
            {isPositive ? '+' : ''}{monthlyChange.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">vs last month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Your Rank</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">#{rank}</div>
          <p className="text-xs text-muted-foreground">on leaderboard</p>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trees Needed</CardTitle>
              <Leaf className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{remainingTrees}</div>
              <p className="text-xs text-muted-foreground">
                {offsetPercentage}% offset ({totalTreesPlanted} planted)
              </p>
            </CardContent>
          </Card>
        </DialogTrigger>
        
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tree Planting Tracker</DialogTitle>
            <DialogDescription>
              Track your tree plantings to offset your carbon emissions. One tree absorbs approximately 21 kg of CO2 per year.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Offset Summary */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Trees Needed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{treesEquivalent}</div>
                  <p className="text-xs text-muted-foreground">to offset {totalEmissions.toFixed(1)} kg CO2</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Trees Planted
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{totalTreesPlanted}</div>
                  <p className="text-xs text-muted-foreground">total planted</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Remaining
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{remainingTrees}</div>
                  <p className="text-xs text-muted-foreground">{offsetPercentage}% complete</p>
                </CardContent>
              </Card>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Offset Progress</span>
                <span className="font-medium">{offsetPercentage}%</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-600 transition-all duration-500"
                  style={{ width: `${offsetPercentage}%` }}
                />
              </div>
            </div>

            {/* Add Tree Planting Form */}
            <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Log Tree Planting</h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="treesPlanted">Number of Trees *</Label>
                  <Input
                    id="treesPlanted"
                    type="number"
                    min="1"
                    placeholder="e.g., 10"
                    value={treesPlanted}
                    onChange={(e) => setTreesPlanted(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plantingDate">Planting Date *</Label>
                  <Input
                    id="plantingDate"
                    type="date"
                    value={plantingDate}
                    onChange={(e) => setPlantingDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="e.g., Planted with local community group..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Logging..." : "Log Tree Planting"}
              </Button>
            </form>

            {/* Planting History */}
            <div className="space-y-3">
              <h3 className="font-semibold">Planting History</h3>
              
              {isLoadingHistory ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading history...</p>
                </div>
              ) : plantingHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Leaf className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No trees planted yet. Start tracking your plantings above!</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {plantingHistory.map((planting) => (
                    <div key={planting.id} className="border rounded-lg p-3 bg-card">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Leaf className="h-4 w-4 text-green-600" />
                            <span className="font-semibold">{planting.treesPlanted} tree{planting.treesPlanted > 1 ? 's' : ''}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(planting.plantingDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          {planting.notes && (
                            <p className="text-sm text-muted-foreground italic mt-1">
                              {planting.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(planting.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}