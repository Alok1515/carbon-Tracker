"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Calendar, 
  Leaf, 
  Target, 
  Sparkles, 
  TreePine,
  Gift,
  CheckCircle2,
  Clock
} from "lucide-react"
import { toast } from "sonner"

interface UserProgress {
  id: number
  progress: number
  completed: boolean
  claimed: boolean
  questDate: string
}

interface DailyQuest {
  id: number
  questId: string
  title: string
  description: string
  type: string
  requirement: number
  pointsReward: number
  icon: string
  userProgress: UserProgress
}

interface DailyQuestsProps {
  userId: string
  triggerRefresh?: number
  onClaim?: () => void
}

const iconMap: { [key: string]: React.ReactNode } = {
  Calendar: <Calendar className="h-5 w-5" />,
  Leaf: <Leaf className="h-5 w-5" />,
  Target: <Target className="h-5 w-5" />,
  Sparkles: <Sparkles className="h-5 w-5" />,
  TreePine: <TreePine className="h-5 w-5" />,
}

export function DailyQuests({ userId, triggerRefresh = 0, onClaim }: DailyQuestsProps) {
  const [quests, setQuests] = useState<DailyQuest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [claimingQuestId, setClaimingQuestId] = useState<string | null>(null)

  const fetchQuests = async () => {
    if (!userId) return
    
    setIsLoading(true)
    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch(`/api/user-daily-quests?userId=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setQuests(data)
      } else {
        console.error("Failed to fetch daily quests")
      }
    } catch (error) {
      console.error("Failed to fetch daily quests:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchQuests()
  }, [userId, triggerRefresh])

  const handleClaimReward = async (questId: string, pointsReward: number) => {
    setClaimingQuestId(questId)
    
    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch("/api/user-daily-quests/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, questId }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`🎉 Claimed ${data.pointsAwarded} bonus points!`)
        
        // Update the local state to mark as claimed
        setQuests(prevQuests =>
          prevQuests.map(quest =>
            quest.questId === questId
              ? {
                  ...quest,
                  userProgress: { ...quest.userProgress, claimed: true }
                }
              : quest
          )
        )

        // Trigger external refresh if provided
        if (onClaim) {
          onClaim()
        }
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to claim reward")
      }
    } catch (error) {
      console.error("Failed to claim reward:", error)
      toast.error("Failed to claim reward")
    } finally {
      setClaimingQuestId(null)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Quests</CardTitle>
          <CardDescription>Complete tasks to earn bonus points</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading quests...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

    const completedCount = quests.filter(q => q.userProgress?.completed).length
    const claimedCount = quests.filter(q => q.userProgress?.claimed).length
    const totalPoints = quests.reduce((sum, q) => sum + (q.userProgress?.claimed ? q.pointsReward : 0), 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Daily Quests
            </CardTitle>
            <CardDescription>
              Complete daily tasks to earn bonus points • Resets daily at midnight
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{claimedCount}/{quests.length}</div>
            <div className="text-xs text-muted-foreground">Claimed Today</div>
          </div>
        </div>
        
        {totalPoints > 0 && (
          <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <Gift className="h-5 w-5" />
              <span className="font-semibold">
                +{totalPoints} bonus points earned today!
              </span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            {quests.map((quest) => {
              const icon = iconMap[quest.icon] || <Sparkles className="h-5 w-5" />
              const progressPercent = Math.min(((quest.userProgress?.progress || 0) / quest.requirement) * 100, 100)
              const isCompleted = quest.userProgress?.completed || false
              const isClaimed = quest.userProgress?.claimed || false

            return (
              <div
                key={quest.questId}
                className={`relative p-4 rounded-lg border-2 transition-all ${
                  isClaimed
                    ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-green-500/50 opacity-75"
                    : isCompleted
                    ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-500"
                    : "bg-card border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`p-3 rounded-full flex-shrink-0 transition-all ${
                      isClaimed
                        ? "bg-green-500/50 text-white"
                        : isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isClaimed ? <CheckCircle2 className="h-5 w-5" /> : icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          {quest.title}
                          {isClaimed && (
                            <Badge variant="secondary" className="bg-green-500 text-white">
                              Claimed
                            </Badge>
                          )}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {quest.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className="font-semibold">
                          <Gift className="h-3 w-3 mr-1" />
                          +{quest.pointsReward}
                        </Badge>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {!isClaimed && (
                      <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-semibold">
                              {quest.userProgress?.progress || 0} / {quest.requirement}
                            </span>
                          </div>
                        <Progress value={progressPercent} className="h-2" />
                      </div>
                    )}

                    {/* Claim Button */}
                    {isCompleted && !isClaimed && (
                      <div className="mt-3">
                        <Button
                          onClick={() => handleClaimReward(quest.questId, quest.pointsReward)}
                          disabled={claimingQuestId === quest.questId}
                          size="sm"
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          {claimingQuestId === quest.questId ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              Claiming...
                            </>
                          ) : (
                            <>
                              <Gift className="h-4 w-4 mr-2" />
                              Claim {quest.pointsReward} Points
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {isClaimed && (
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Reward claimed! +{quest.pointsReward} points
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        {quests.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{completedCount}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{claimedCount}</p>
                <p className="text-xs text-muted-foreground">Claimed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{quests.length - completedCount}</p>
                <p className="text-xs text-muted-foreground">Remaining</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
