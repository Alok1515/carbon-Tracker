"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, Trophy, Sparkles } from "lucide-react"
import { toast } from "sonner"

interface Quest {
  questId: string
  title: string
  description: string
  category: string
  points: number
  icon: string
  requirement: number
  action: string
  progress: number
  completed: boolean
  completedAt?: string
  pointsEarned: number
}

interface DailyQuestsProps {
  userId: string
}

export function DailyQuests({ userId }: DailyQuestsProps) {
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPoints, setTotalPoints] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)

  const fetchQuests = async () => {
    try {
      const response = await fetch(`/api/user-daily-quests?userId=${userId}`)
      if (!response.ok) throw new Error('Failed to fetch quests')
      
      const data = await response.json()
      setQuests(data)
      
      const completed = data.filter((q: Quest) => q.completed).length
      const points = data.reduce((sum: number, q: Quest) => sum + q.pointsEarned, 0)
      
      setCompletedCount(completed)
      setTotalPoints(points)
    } catch (error) {
      console.error('Error fetching quests:', error)
      toast.error('Failed to load daily quests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchQuests()
    }
  }, [userId])

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'tracking':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      case 'engagement':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
      case 'action':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'achievement':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Daily Quests
          </CardTitle>
          <CardDescription>Loading your daily challenges...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Daily Quests
            </CardTitle>
            <CardDescription>
              Complete tasks to earn bonus points
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {totalPoints}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {completedCount}/{quests.length} completed
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {quests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No daily quests available</p>
              <p className="text-sm mt-2">Check back tomorrow!</p>
            </div>
          ) : (
            quests.map((quest) => {
              const progressPercent = Math.min((quest.progress / quest.requirement) * 100, 100)
              
              return (
                <div
                  key={quest.questId}
                  className={`relative p-4 rounded-lg border-2 transition-all ${
                    quest.completed
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                      : 'border-border hover:border-primary'
                  }`}
                >
                  {quest.completed && (
                    <div className="absolute top-2 right-2">
                      <div className="bg-green-500 text-white rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3">
                    <div className="text-3xl flex-shrink-0">{quest.icon}</div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{quest.title}</h4>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getCategoryColor(quest.category)}`}
                        >
                          {quest.category}
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-2">
                        {quest.description}
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            Progress: {quest.progress}/{quest.requirement}
                          </span>
                          <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                            +{quest.points} pts
                          </span>
                        </div>
                        
                        <Progress value={progressPercent} className="h-2" />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {quests.length > 0 && completedCount === quests.length && (
          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border-2 border-green-500">
            <div className="flex items-center gap-3">
              <div className="text-4xl">🎉</div>
              <div>
                <h4 className="font-bold text-green-700 dark:text-green-300">
                  All Quests Complete!
                </h4>
                <p className="text-sm text-green-600 dark:text-green-400">
                  You've earned {totalPoints} bonus points today. Great job!
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
