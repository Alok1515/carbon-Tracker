"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { authClient, useSession, logout } from "@/lib/auth-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DailyQuests } from "@/components/gamification/DailyQuests"
import { Leaderboard } from "@/components/gamification/Leaderboard"
import { Badges } from "@/components/gamification/Badges"
import { ComparisonChart } from "@/components/gamification/ComparisonChart"
import { RewardsShop } from "@/components/gamification/RewardsShop"
import { ProfileCustomization } from "@/components/gamification/ProfileCustomization"
import { UserAvatar } from "@/components/gamification/UserAvatar"
import { useUserProfile } from "@/hooks/useUserProfile"
import { 
  Trophy, 
  Target,
  Users,
  TrendingDown,
  Award,
  Moon,
  Sun,
  Menu,
  LogOut,
  User,
  Zap,
  Star,
  ShoppingBag,
  UserCog
} from "lucide-react"
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
import Link from "next/link"

interface UserStats {
  totalEmissions: number
  monthlyEmissions: number
  rank: number
  treesEquivalent: number
}

interface LeaderboardEntry {
  userId: string
  userName: string
  userEmail: string
  totalEmissions: number
  monthlyEmissions: number
  rank: number
  treesEquivalent: number
  accountType?: "individual" | "company" | "city"
}

interface QuestPoints {
  totalPoints: number
}

export default function GamificationPage() {
  const router = useRouter()
  const { data: session, isPending, refetch } = useSession()
  const { profile: userProfile, loading: profileLoading, refetch: refetchProfile } = useUserProfile(session?.user?.id)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [questPoints, setQuestPoints] = useState<QuestPoints>({ totalPoints: 0 })
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true)
  const [badgeRefreshTrigger, setBadgeRefreshTrigger] = useState(0)
  const [profileData, setProfileData] = useState<any>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/")
    }
  }, [session, isPending, router])

  // Fetch user stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!session?.user?.id) return
      
      setIsLoadingStats(true)
      try {
        const [statsRes, pointsRes] = await Promise.all([
          fetch(`/api/user-stats?userId=${session.user.id}`),
          fetch(`/api/user-quest-points?userId=${session.user.id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("bearer_token")}` }
          })
        ])

        if (statsRes.ok) {
          const data = await statsRes.json()
          setUserStats(data)
        }

        if (pointsRes.ok) {
          const data = await pointsRes.json()
          setQuestPoints(data)
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      } finally {
        setIsLoadingStats(false)
      }
    }

    fetchStats()
  }, [session?.user?.id])

  // Fetch leaderboard
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoadingLeaderboard(true)
      try {
        const response = await fetch("/api/leaderboard")
        if (response.ok) {
          const data = await response.json()
          setLeaderboardData(data)
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error)
      } finally {
        setIsLoadingLeaderboard(false)
      }
    }

    fetchLeaderboard()
  }, [])

  // Fetch user profile for available points
  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user?.id) return
      
      try {
        const response = await fetch(`/api/user-profile?userId=${session.user.id}`)
        if (response.ok) {
          const data = await response.json()
          setProfileData(data)
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error)
      }
    }

    fetchProfile()
  }, [session?.user?.id])

  const handleRefreshPoints = () => {
    // Refetch quest points and profile
    if (session?.user?.id) {
      fetch(`/api/user-quest-points?userId=${session.user.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("bearer_token")}` }
      })
        .then(res => res.json())
        .then(data => setQuestPoints(data))

      fetch(`/api/user-profile?userId=${session.user.id}`)
        .then(res => res.json())
        .then(data => setProfileData(data))
      
      // Also refetch user profile for header
      refetchProfile()
    }
  }

  const handleSignOut = async () => {
    await logout()
    refetch()
    router.push("/")
  }

  if (isPending || isLoadingStats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading gamification...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  // Calculate available points
  const availablePoints = profileData 
    ? questPoints.totalPoints - profileData.totalPointsSpent 
    : questPoints.totalPoints

  const computeMonthlyChange = (totalEmissions: number, monthlyEmissions: number) => {
    const monthly = monthlyEmissions || 0
    const total = totalEmissions || 0
    const previous = Math.max(total - monthly, 0)
    if (previous === 0) return monthly > 0 ? 100 : 0
    return ((monthly - previous) / previous) * 100
  }

  // Calculate stats
  const totalEmissions = userStats?.totalEmissions ? userStats.totalEmissions / 1000 : 0
  const rank = userStats?.rank || 0

  // Format leaderboard data
  const leaderboardEntries = leaderboardData.map((entry) => {
    const monthlyChange = computeMonthlyChange(entry.totalEmissions, entry.monthlyEmissions)

    return {
      rank: entry.rank,
      name: entry.userName,
      emissions: entry.totalEmissions / 1000,
      reduction: parseFloat(monthlyChange.toFixed(1)),
      type: (entry.accountType || "individual") as "individual" | "company" | "city",
      userId: entry.userId,
      accountType: (entry.accountType || "individual") as "individual" | "company" | "city",
    }
  })

  // Comparison data
  const userAccountType = userProfile?.accountType || "individual"
  
  // Filter leaderboard by user's account type for more relevant comparison
  const relevantLeaderboard = leaderboardData.filter(
    (entry) => (entry.accountType || "individual") === userAccountType
  )

  const averageEmissions = relevantLeaderboard.length > 0
    ? relevantLeaderboard.reduce((sum, entry) => sum + entry.totalEmissions, 0) / relevantLeaderboard.length / 1000
    : 0
  const topPerformerEmissions = relevantLeaderboard.length > 0
    ? relevantLeaderboard[0].totalEmissions / 1000
    : 0

  const userCategoryDisplay = userAccountType === 'individual' ? 'Individual' : userAccountType === 'company' ? 'Company' : 'City'

  const comparisonData = {
    userData: { name: "You", emissions: totalEmissions },
    averageData: { name: `${userCategoryDisplay} Average`, emissions: averageEmissions },
    topPerformerData: { name: `Top ${userCategoryDisplay}`, emissions: topPerformerEmissions },
  }

  // Get display name from profile or fallback to session name
  const displayName = userProfile?.displayName || session?.user?.name || "User"

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
                  <a href="/gamification" className="text-lg font-semibold text-primary">Gamification</a>
                  <a href="/achievements" className="text-lg hover:text-primary">Achievements</a>
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
            <a href="/gamification" className="text-sm font-semibold text-primary">
              Gamification
            </a>
            <a href="/achievements" className="text-sm hover:text-primary transition-colors">
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
                  <span className="hidden md:inline">{displayName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <UserAvatar
                    name={displayName}
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
          <div className="space-y-2">
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Trophy className="h-10 w-10 text-yellow-500" />
              Gamification Hub
            </h1>
            <p className="text-muted-foreground text-lg">
              Compete, earn rewards, and track your progress on the leaderboard
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Global Rank
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">#{rank || "N/A"}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {rank <= 10 ? "🔥 Top 10!" : rank <= 50 ? "⭐ Top 50!" : "Keep climbing!"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-500/20 hover:border-green-500/40 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Available Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">{availablePoints}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {profileData?.totalPointsSpent || 0} spent
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-500/20 hover:border-blue-500/40 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Total CO2
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-500">{totalEmissions.toFixed(1)} kg</div>
                <p className="text-xs text-muted-foreground mt-1">Lifetime emissions</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-yellow-500/20 hover:border-yellow-500/40 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Active Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-500">{leaderboardData.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Competing now</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-4 flex-wrap">
            <Link href="/achievements">
              <Button variant="outline" className="gap-2">
                <Award className="h-4 w-4" />
                View All Achievements
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="gap-2">
                <Target className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

            {/* Daily Quests Section */}
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-6 w-6 text-yellow-500" />
                      Daily Quests
                    </CardTitle>
                    <CardDescription>Complete daily challenges to earn bonus points</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <DailyQuests userId={session.user.id} onClaim={handleRefreshPoints} />
              </CardContent>
            </Card>

          {/* Main Tabs */}
          <Tabs defaultValue="leaderboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="leaderboard">
                <Trophy className="h-4 w-4 mr-2" />
                Leaderboard
              </TabsTrigger>
              <TabsTrigger value="comparison">
                <TrendingDown className="h-4 w-4 mr-2" />
                Comparison
              </TabsTrigger>
              <TabsTrigger value="badges">
                <Award className="h-4 w-4 mr-2" />
                My Badges
              </TabsTrigger>
              <TabsTrigger value="shop">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Shop
              </TabsTrigger>
              <TabsTrigger value="profile">
                <UserCog className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
            </TabsList>

            <TabsContent value="leaderboard" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Global Leaderboard</CardTitle>
                  <CardDescription>
                    See how you rank against other users reducing their carbon footprint
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingLeaderboard ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading leaderboard...</p>
                    </div>
                  ) : (
                    <Leaderboard entries={leaderboardEntries} currentUserRank={rank} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Comparison</CardTitle>
                  <CardDescription>
                    Compare your emissions with the community average and top performers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ComparisonChart {...comparisonData} />
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Your Emissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalEmissions.toFixed(1)} kg</div>
                    <p className="text-xs text-muted-foreground mt-1">Total CO2</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">{userCategoryDisplay} Average</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{averageEmissions.toFixed(1)} kg</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      You're {totalEmissions < averageEmissions ? "below" : "above"} average
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Top {userCategoryDisplay}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{topPerformerEmissions.toFixed(1)} kg</div>
                    <p className="text-xs text-muted-foreground mt-1">Best in {userCategoryDisplay.toLowerCase()} community</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="badges" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Achievement Badges</CardTitle>
                      <CardDescription>
                        Earn badges by reaching milestones and completing challenges
                      </CardDescription>
                    </div>
                    <Link href="/achievements">
                      <Button variant="outline" size="sm">
                        View All
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <Badges userId={session.user.id} triggerRefresh={badgeRefreshTrigger} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="shop" className="space-y-4">
              <RewardsShop 
                userId={session.user.id}
                availablePoints={availablePoints}
                onPurchase={handleRefreshPoints}
              />
            </TabsContent>

            <TabsContent value="profile" className="space-y-4">
              <ProfileCustomization
                userId={session.user.id}
                userName={displayName}
                userEmail={session.user.email}
                onEquipChange={refetchProfile}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
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