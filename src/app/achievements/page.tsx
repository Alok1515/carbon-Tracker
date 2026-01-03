"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { authClient, useSession, logout } from "@/lib/auth-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserAvatar } from "@/components/gamification/UserAvatar"
import { useUserProfile } from "@/hooks/useUserProfile"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Leaf, 
  Zap, 
  Award, 
  Target, 
  Calendar,
  Bike,
  Home,
  TreePine,
  Trophy,
  ArrowLeft,
  Moon,
  Sun,
  Menu,
  LogOut,
  User
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
  userId: string
  badgeId: string
  progress: number
  earned: boolean
  earnedAt: string | null
  justEarned?: boolean
  name?: string
}

interface CompleteBadgeData {
  badge: BadgeDefinition
  progress: number
  earned: boolean
  earnedAt: string | null
}

const iconMap: { [key: string]: React.ReactNode } = {
  Leaf: <Leaf className="h-8 w-8" />,
  Target: <Target className="h-8 w-8" />,
  Bike: <Bike className="h-8 w-8" />,
  Zap: <Zap className="h-8 w-8" />,
  Home: <Home className="h-8 w-8" />,
  Calendar: <Calendar className="h-8 w-8" />,
  Award: <Award className="h-8 w-8" />,
  TreePine: <TreePine className="h-8 w-8" />,
}

export default function AchievementsPage() {
  const router = useRouter()
  const { data: session, isPending, refetch } = useSession()
  const { profile: userProfile } = useUserProfile(session?.user?.id)
  const [badges, setBadges] = useState<CompleteBadgeData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Redirect if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/")
    }
  }, [session, isPending, router])

  useEffect(() => {
    const fetchBadges = async () => {
      if (!session?.user?.id) return
      
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
          body: JSON.stringify({ userId: session.user.id }),
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
        const allBadges: BadgeDefinition[] = await allBadgesRes.json()
        
        // Fetch user's badge progress
        const userBadgesRes = await fetch(`/api/user-badges?userId=${session.user.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const userBadges = await userBadgesRes.json()
        
        // Create a map of user progress by badgeId
        const progressMap = new Map()
        userBadges.forEach((ub: any) => {
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
  }, [session?.user?.id])

  const handleSignOut = async () => {
    await logout()
    refetch()
    router.push("/")
  }

  if (isPending || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading achievements...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  const earnedBadges = badges.filter(b => b.earned)
  const inProgressBadges = badges.filter(b => !b.earned)
  const earnedCount = earnedBadges.length
  const totalCount = badges.length
  const completionPercentage = Math.round((earnedCount / totalCount) * 100)

  // Group badges by category
  const badgesByCategory = badges.reduce((acc, badge) => {
    const category = badge.badge.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(badge)
    return acc
  }, {} as Record<string, CompleteBadgeData[]>)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <nav className="flex flex-col gap-4 mt-8">
                  <a href="/" className="text-lg hover:text-primary">Home</a>
                  <a href="/dashboard" className="text-lg hover:text-primary">Dashboard</a>
                  <a href="/gamification" className="text-lg hover:text-primary">Gamification</a>
                  <a href="/achievements" className="text-lg font-semibold text-primary">Achievements</a>
                </nav>
              </SheetContent>
            </Sheet>
            
            <h1 className="text-xl font-bold flex items-center gap-2">
              🌍 <span>CarbonTrack</span>
            </h1>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <a href="/" className="text-sm hover:text-primary transition-colors">
              Home
            </a>
            <a href="/dashboard" className="text-sm hover:text-primary transition-colors">
              Dashboard
            </a>
            <a href="/gamification" className="text-sm hover:text-primary transition-colors">
              Gamification
            </a>
            <a href="/achievements" className="text-sm font-semibold text-primary">
              Achievements
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <div className={userProfile?.frameItem?.cssClass || ""}>
                    <User className="h-5 w-5" />
                  </div>
                  <span className="hidden md:inline">{session?.user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <UserAvatar
                    name={userProfile?.displayName || session?.user?.name || ""}
                    email={session?.user?.email}
                    size="sm"
                    frameClass={userProfile?.frameItem?.cssClass}
                    titleText={userProfile?.titleItem?.name}
                    titleColor={userProfile?.titleItem?.metadata?.color}
                    titleBold={userProfile?.titleItem?.metadata?.bold}
                    titleItalic={userProfile?.titleItem?.metadata?.italic}
                  />
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Trophy className="h-8 w-8 text-yellow-500" />
                My Achievements
              </h1>
              <p className="text-muted-foreground mt-1">
                Track your progress and collect badges for reducing your carbon footprint
              </p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Badges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Available to earn</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Badges Earned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">{earnedCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {completionPercentage}% complete
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  In Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{inProgressBadges.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Keep working on these</p>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Progress</CardTitle>
              <CardDescription>
                You've earned {earnedCount} out of {totalCount} badges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{completionPercentage}% Complete</span>
                  <span>{totalCount - earnedCount} remaining</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Badges Tabs */}
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Badges</TabsTrigger>
              <TabsTrigger value="earned">Earned ({earnedCount})</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress ({inProgressBadges.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              {Object.entries(badgesByCategory).map(([category, categoryBadges]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle>{category}</CardTitle>
                    <CardDescription>
                      {categoryBadges.filter(b => b.earned).length} of {categoryBadges.length} earned
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {categoryBadges.map((badgeData) => (
                        <BadgeCard key={badgeData.badge._id} badgeData={badgeData} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="earned">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {earnedBadges.map((badgeData) => (
                  <BadgeCard key={badgeData.badge._id} badgeData={badgeData} />
                ))}
              </div>
              {earnedBadges.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">
                      No badges earned yet. Start tracking your emissions to earn your first badge!
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="in-progress">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {inProgressBadges.map((badgeData) => (
                  <BadgeCard key={badgeData.badge._id} badgeData={badgeData} />
                ))}
              </div>
              {inProgressBadges.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Award className="h-16 w-16 mx-auto mb-4 text-green-500" />
                    <p className="text-lg font-semibold mb-2">Congratulations!</p>
                    <p className="text-muted-foreground">
                      You've earned all available badges! 🎉
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

function BadgeCard({ badgeData }: { badgeData: CompleteBadgeData }) {
  const icon = iconMap[badgeData.badge.icon] || <Award className="h-8 w-8" />
  
  return (
    <Card
      className={`transition-all hover:shadow-lg ${
        badgeData.earned
          ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-500"
          : "bg-muted/30 hover:border-primary/50"
      }`}
    >
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div
            className={`p-4 rounded-full transition-all ${
              badgeData.earned
                ? "bg-green-500 text-white"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {icon}
          </div>
          
          <div className="space-y-1">
            <h3 className="font-semibold">{badgeData.badge.name}</h3>
            <p className="text-xs text-muted-foreground">
              {badgeData.badge.description}
            </p>
          </div>
          
          {badgeData.earned ? (
            <div className="space-y-2 w-full">
              <Badge className="bg-green-500 hover:bg-green-600">
                <Award className="h-3 w-3 mr-1" />
                Earned
              </Badge>
              {badgeData.earnedAt && (
                <p className="text-xs text-muted-foreground">
                  {new Date(badgeData.earnedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : (
            <div className="w-full space-y-2">
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
              <p className="text-xs text-muted-foreground">
                {badgeData.badge.requirement}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}