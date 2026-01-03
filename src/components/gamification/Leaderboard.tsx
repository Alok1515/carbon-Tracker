"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Award, TrendingDown, Sparkles } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSession } from "@/lib/auth-client"
import { useQuestProgress } from "@/hooks/useQuestProgress"

interface LeaderboardEntry {
  rank: number
  name: string
  emissions: number
  reduction: number
  avatar?: string
  type: "individual" | "company" | "city"
  userId?: string
  accountType?: "individual" | "company" | "city"
}

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  currentUserRank?: number
  currentUserAccountType?: "individual" | "company" | "city"
}

interface UserCustomization {
  frameClass?: string
  titleText?: string
  titleColor?: string
  titleBold?: boolean
  titleItalic?: boolean
}

export function Leaderboard({ entries, currentUserRank, currentUserAccountType = "individual" }: LeaderboardProps) {
  const { data: session } = useSession()
  const { trackProgress } = useQuestProgress(session?.user?.id)
  const [userCustomizations, setUserCustomizations] = useState<Record<string, UserCustomization>>({})

  // Track quest progress for viewing leaderboard
  useEffect(() => {
    if (session?.user?.id) {
      trackProgress('check_leaderboard', 1)
    }
  }, [session?.user?.id, trackProgress])

  // Fetch customizations for all leaderboard users
  useEffect(() => {
    const fetchCustomizations = async () => {
      const userIds = entries
        .filter(e => e.userId)
        .map(e => e.userId as string)
      
      const customizationsMap: Record<string, UserCustomization> = {}
      
      await Promise.all(
        userIds.map(async (userId) => {
          try {
            const [profileRes, inventoryRes] = await Promise.all([
              fetch(`/api/user-profile?userId=${userId}`),
              fetch(`/api/user-inventory?userId=${userId}`)
            ])
            
            if (profileRes.ok && inventoryRes.ok) {
              const profile = await profileRes.json()
              const inventory = await inventoryRes.json()
              
              const frameItem = inventory.find((item: any) => 
                item.itemId === profile.equippedFrame && item.item?.type === 'avatar_frame'
              )
              const titleItem = inventory.find((item: any) => 
                item.itemId === profile.equippedTitle && item.item?.type === 'title'
              )
              
              customizationsMap[userId] = {
                frameClass: frameItem?.item?.cssClass,
                titleText: titleItem?.item?.name,
                titleColor: titleItem?.item?.metadata?.color,
                titleBold: titleItem?.item?.metadata?.bold,
                titleItalic: titleItem?.item?.metadata?.italic
              }
            }
          } catch (error) {
            // Silently fail for individual users
          }
        })
      )
      
      setUserCustomizations(customizationsMap)
    }
    
    if (entries.length > 0) {
      fetchCustomizations()
    }
  }, [entries])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-700" />
      default:
        return <span className="text-sm font-semibold text-muted-foreground">#{rank}</span>
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Filter entries by account type - use accountType field from API
  const filterByType = (type: string) => {
    if (type === "all") return entries
    return entries.filter((entry) => (entry.accountType || entry.type) === type)
  }

  const renderEntries = (filteredEntries: LeaderboardEntry[]) => (
    <div className="space-y-3">
      {filteredEntries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No entries in this category yet.</p>
          <p className="text-sm mt-2">Be the first to log your emissions!</p>
        </div>
      ) : (
        filteredEntries.slice(0, 10).map((entry) => {
          const customization = entry.userId ? userCustomizations[entry.userId] : null
          
          return (
            <div
              key={entry.userId || `rank-${entry.rank}`}
              className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                entry.rank === currentUserRank
                  ? "bg-primary/5 border-primary"
                  : "bg-card hover:bg-accent/50"
              }`}
            >
              <div className="flex items-center justify-center w-10">
                {getRankIcon(entry.rank)}
              </div>
              
              <div className={customization?.frameClass || ""}>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={entry.avatar} alt={entry.name} />
                  <AvatarFallback>{getInitials(entry.name)}</AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold truncate">{entry.name}</p>
                  {entry.rank === currentUserRank && (
                    <Badge variant="secondary" className="text-xs">You</Badge>
                  )}
                  {customization?.titleText && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${customization.titleBold ? 'font-bold' : ''} ${customization.titleItalic ? 'italic' : ''}`}
                      style={{ 
                        backgroundColor: `${customization.titleColor}20`,
                        color: customization.titleColor 
                      }}
                    >
                      <Sparkles className="h-3 w-3" />
                      {customization.titleText}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {entry.emissions.toFixed(1)} kg CO2
                </p>
              </div>
              
              <div className="flex items-center gap-1 text-green-600">
                <TrendingDown className="h-4 w-4" />
                <span className="text-sm font-semibold">{entry.reduction}%</span>
              </div>
            </div>
          )
        })
      )}
    </div>
  )

  // Get category label
  const getCategoryLabel = (type: string) => {
    switch(type) {
      case "individual": return "Individuals"
      case "company": return "Companies"
      case "city": return "Cities"
      default: return "All"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leaderboard</CardTitle>
        <CardDescription>
          Top performers in the {getCategoryLabel(currentUserAccountType)} category
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={currentUserAccountType} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="individual">Individuals</TabsTrigger>
            <TabsTrigger value="company">Companies</TabsTrigger>
            <TabsTrigger value="city">Cities</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            {renderEntries(filterByType("all"))}
          </TabsContent>
          
          <TabsContent value="individual" className="mt-4">
            {renderEntries(filterByType("individual"))}
          </TabsContent>
          
          <TabsContent value="company" className="mt-4">
            {renderEntries(filterByType("company"))}
          </TabsContent>
          
          <TabsContent value="city" className="mt-4">
            {renderEntries(filterByType("city"))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}