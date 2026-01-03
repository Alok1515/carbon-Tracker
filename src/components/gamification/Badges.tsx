"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  Leaf, 
  Zap, 
  Award, 
  Target, 
  Calendar,
  Bike,
  Home,
  TreePine
} from "lucide-react"

interface BadgeDefinition {
  _id: string
  badgeId: string
  name: string
  description: string
  icon: string
  requirement: string
  category: string
  createdAt: string
}

interface UserBadgeProgress {
  id: string
  userId: string
  badgeId: string
  progress: number
  earned: boolean
  earnedAt: string | null
  justEarned?: boolean
  name?: string
  createdAt: string
  updatedAt: string
}

interface CompleteBadgeData {
  badge: BadgeDefinition
  progress: number
  earned: boolean
  earnedAt: string | null
}

interface BadgesProps {
  userId: string
  triggerRefresh?: number
}

const iconMap: { [key: string]: React.ReactNode } = {
  Leaf: <Leaf className="h-6 w-6" />,
  Target: <Target className="h-6 w-6" />,
  Bike: <Bike className="h-6 w-6" />,
  Zap: <Zap className="h-6 w-6" />,
  Home: <Home className="h-6 w-6" />,
  Calendar: <Calendar className="h-6 w-6" />,
  Award: <Award className="h-6 w-6" />,
  TreePine: <TreePine className="h-6 w-6" />,
}

export function Badges({ userId, triggerRefresh = 0 }: BadgesProps) {
  const [badges, setBadges] = useState<CompleteBadgeData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchBadges = async () => {
      if (!userId) return
      
      setIsLoading(true)
      try {
        const token = localStorage.getItem("bearer_token")
        
        // First, check/update badges
        const checkRes = await fetch("/api/check-badges", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId }),
        })

        if (checkRes.ok) {
          const updatedBadgesData: UserBadgeProgress[] = await checkRes.json()
          // Notify about just earned badges
          updatedBadgesData.forEach(ub => {
            if (ub.justEarned) {
              toast.success(`Achievement Earned! 🎉`, {
                description: `You've unlocked the "${ub.name || ub.badgeId}" badge!`
              })
            }
          })
        }
        
          // Fetch all available badges
          const allBadgesRes = await fetch("/api/badges")
          if (!allBadgesRes.ok) {
            console.error("Badges API failed", allBadgesRes.status)
            setBadges([])
            setIsLoading(false)
            return
          }
          const allBadgesJson = await allBadgesRes.json()
          if (!Array.isArray(allBadgesJson)) {
            console.error("Badges API returned non-array response", allBadgesJson)
            setBadges([])
            setIsLoading(false)
            return
          }
          const allBadges: BadgeDefinition[] = allBadgesJson
          
          // Fetch user's badge progress
          const userBadgesRes = await fetch(`/api/user-badges?userId=${userId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          if (!userBadgesRes.ok) {
            console.error("User badges API failed", userBadgesRes.status)
            setBadges([])
            setIsLoading(false)
            return
          }
          const userBadgesJson = await userBadgesRes.json()
          if (!Array.isArray(userBadgesJson)) {
            console.error("User badges API returned non-array response", userBadgesJson)
            setBadges([])
            setIsLoading(false)
            return
          }
          const userBadges: UserBadgeProgress[] = userBadgesJson
          
          // Create a map of user progress by badgeId
          const progressMap = new Map<string, UserBadgeProgress>()
          userBadges.forEach(ub => {
            progressMap.set(ub.badgeId, ub)
          })
          
          // Combine all badges with user progress
          const completeBadges: CompleteBadgeData[] = allBadges.map(badge => {
            const userProgress = progressMap.get(badge.badgeId)
            return {
              badge,
              progress: userProgress?.progress || 0,
              earned: userProgress?.earned || false,
              earnedAt: userProgress?.earnedAt || null,
            }
          })
          
          // Sort: earned badges first, then by progress
          completeBadges.sort((a, b) => {
            if (a.earned && !b.earned) return -1
            if (!a.earned && b.earned) return 1
            return b.progress - a.progress
          })
          
          setBadges(completeBadges)

      } catch (error) {
        console.error("Failed to fetch badges:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBadges()
  }, [userId, triggerRefresh])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Achievements & Badges</CardTitle>
          <CardDescription>Earn badges by reducing your carbon footprint</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading badges...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const earnedCount = badges.filter(b => b.earned).length
  const totalCount = badges.length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Achievements & Badges</CardTitle>
            <CardDescription>
              Earn badges by reducing your carbon footprint • {earnedCount} of {totalCount} earned
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{earnedCount}/{totalCount}</div>
            <div className="text-xs text-muted-foreground">Badges Earned</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {badges.map((badgeData) => {
            const icon = iconMap[badgeData.badge.icon] || <Award className="h-6 w-6" />
            
            return (
              <div
                key={badgeData.badge._id}
                className={`relative p-4 rounded-lg border-2 transition-all ${
                  badgeData.earned
                    ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-500"
                    : "bg-muted/30 border-muted hover:border-muted-foreground/30"
                }`}
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <div
                    className={`p-3 rounded-full transition-all ${
                      badgeData.earned
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {icon}
                  </div>
                  
                  <h3 className="font-semibold text-sm">{badgeData.badge.name}</h3>
                  <p className="text-xs text-muted-foreground">{badgeData.badge.description}</p>
                  
                  {badgeData.earned ? (
                    <Badge className="bg-green-500 hover:bg-green-600">
                      <Award className="h-3 w-3 mr-1" />
                      Earned
                    </Badge>
                  ) : (
                    <div className="w-full space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold">{badgeData.progress}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${badgeData.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {badgeData.badge.requirement}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}