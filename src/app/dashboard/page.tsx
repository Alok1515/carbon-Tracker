"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { authClient, useSession, logout } from "@/lib/auth-client"
import { EmissionInputForm } from "@/components/dashboard/EmissionInputForm"
import { EmissionCharts } from "@/components/dashboard/EmissionCharts"
import { DashboardStats } from "@/components/dashboard/DashboardStats"
import { Leaderboard } from "@/components/gamification/Leaderboard"
import { Badges } from "@/components/gamification/Badges"
import { ComparisonChart } from "@/components/gamification/ComparisonChart"
import { CarbonChatbot } from "@/components/ai/CarbonChatbot"
import { PersonalizedInsights } from "@/components/ai/PersonalizedInsights"
import { DashboardSummary } from "@/components/ai/DashboardSummary"
import { UserAvatar } from "@/components/gamification/UserAvatar"
import { useUserProfile } from "@/hooks/useUserProfile"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Menu, LogOut, User } from "lucide-react"
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
import { toast } from "sonner"
import { useQuestProgress } from "@/hooks/useQuestProgress"

interface EmissionEntry {
  id: number
  type: string
  category: string
  value: number
  unit: string
  co2: number
  createdAt: string
}

interface UserStats {
  totalEmissions: number
  monthlyEmissions: number
  rank: number
  treesEquivalent: number
  grossEmissions?: number
  carbonOffset?: number
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

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, isPending, refetch } = useSession()
  const { profile: userProfile } = useUserProfile(session?.user?.id)
  const [emissions, setEmissions] = useState<EmissionEntry[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [isLoadingEmissions, setIsLoadingEmissions] = useState(true)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true)
  const [badgeRefreshTrigger, setBadgeRefreshTrigger] = useState(0)
  const [insightsRefreshTrigger, setInsightsRefreshTrigger] = useState(0)
  const [questRefreshTrigger, setQuestRefreshTrigger] = useState(0)

  const { trackProgress } = useQuestProgress(session?.user?.id)

  // Track dashboard visit on mount
  useEffect(() => {
    if (session?.user?.id) {
      trackProgress('visit_dashboard', 1)
    }
  }, [session?.user?.id, trackProgress])

  // Redirect if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/")
    }
  }, [session, isPending, router])

  // Unified data refresh function - optimized to prevent cascading re-renders
  const refreshData = useCallback(async (userId: string) => {
    try {
      const token = localStorage.getItem("bearer_token")
      
      // Fetch all data in parallel to reduce load time
      const [emissionsRes, statsRes, leaderboardRes] = await Promise.all([
        fetch(`/api/emissions?userId=${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`/api/user-stats?userId=${userId}`),
        fetch("/api/leaderboard")
      ])

      if (emissionsRes.ok) {
        const data = await emissionsRes.json()
        setEmissions(data)
      }
      
      if (statsRes.ok) {
        const data = await statsRes.json()
        setUserStats(data)
      }
      
      if (leaderboardRes.ok) {
        const data = await leaderboardRes.json()
        setLeaderboardData(data)
      }
    } catch (error) {
      console.error("Failed to refresh data:", error)
    } finally {
      setIsLoadingEmissions(false)
      setIsLoadingStats(false)
      setIsLoadingLeaderboard(false)
    }
  }, [])

  // Initial data fetch - single effect instead of multiple cascading effects
  useEffect(() => {
    if (session?.user?.id) {
      refreshData(session.user.id)
    }
  }, [session?.user?.id, refreshData])

  const handleSignOut = async () => {
    await logout()
    refetch()
    router.push("/")
  }

  const handleEmissionSubmit = async (data: { type: string; category: string; value: number; unit: string; co2?: number; subcategory?: string }) => {
    if (!session?.user?.id) {
      toast.error("You must be logged in to add emissions")
      return
    }

    // Use pre-calculated CO2 if provided (from Precision Mode), otherwise calculate with basic factors
    let co2Grams: number
    
    if (data.co2 !== undefined) {
      // Precision mode already calculated the CO2 value
      co2Grams = data.co2
    } else {
      // Fallback to basic calculation for legacy/simple mode
      const emissionFactors: { [key: string]: number } = {
        transportation: 0.25,
        electricity: 0.45,
        heating: 0.3,
        flights: 75,
        food: 2,
        manufacturing: 5,
        energy: 0.5,
        waste: 1,
        product_lca: 1,
        supply_chain: 0.5,
        public_transport: 1.0,
        buildings: 0.08,
        street_lighting: 0.15,
        waste_management: 0.5,
        water_treatment: 0.5,
      }

      const co2Kg = data.value * (emissionFactors[data.category] || 1)
      co2Grams = Math.round(co2Kg * 1000)
    }

    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch("/api/emissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: session.user.id,
          type: data.type,
          category: data.category,
          value: data.value,
          unit: data.unit,
          co2: co2Grams,
          subcategory: data.subcategory || "",
        }),
      })

      if (response.ok) {
        const newEmission = await response.json()
        
        // Optimistically update emissions UI first
        setEmissions([newEmission, ...emissions])
        
        toast.success("Emission added successfully!")
        
        // Track quest progress for logging emissions
        await trackProgress('log_emissions', 1)
        
        // Recalculate user stats and leaderboard in sequence
        await fetch(`/api/user-stats?userId=${session.user.id}`)
        await fetch("/api/calculate-leaderboard", { method: "POST" })
        
        // Now refresh all data to get updated values
        await refreshData(session.user.id)
        
        // Trigger badge refresh
        setBadgeRefreshTrigger(prev => prev + 1)
        
        // Trigger insights refresh
        setInsightsRefreshTrigger(prev => prev + 1)
        
        // Trigger quest refresh
        setQuestRefreshTrigger(prev => prev + 1)
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to add emission")
      }
    } catch (error) {
      console.error("Failed to submit emission:", error)
      toast.error("Failed to add emission")
    }
  }

  // Calculate statistics from emissions data
  // IMPORTANT: Use userStats.totalEmissions which already includes tree offset
  const totalEmissions = userStats?.totalEmissions ? userStats.totalEmissions / 1000 : 0 // Convert to kg
  const monthlyChange = userStats?.monthlyEmissions 
    ? ((userStats.monthlyEmissions - (userStats.totalEmissions - userStats.monthlyEmissions)) / 
       (userStats.totalEmissions - userStats.monthlyEmissions || 1)) * 100 
    : 0
  const rank = userStats?.rank || 0
  const treesEquivalent = userStats?.treesEquivalent || 0

  const computeMonthlyChange = (totalEmissionsValue: number, monthlyEmissionsValue: number) => {
    const monthly = monthlyEmissionsValue || 0
    const total = totalEmissionsValue || 0
    const previous = Math.max(total - monthly, 0)
    if (previous === 0) return monthly > 0 ? 100 : 0
    return ((monthly - previous) / previous) * 100
  }

  // Prepare chart data
  const categoryData = emissions.reduce((acc: any[], curr) => {
    const existing = acc.find((item) => item.name === curr.category)
    const co2Kg = curr.co2 / 1000
    if (existing) {
      existing.value += co2Kg
    } else {
      acc.push({ name: curr.category, value: co2Kg })
    }
    return acc
  }, [])

  // Calculate timeline data from actual emissions
  const timelineData = (() => {
    const monthlyData: { [key: string]: number } = {}
    const now = new Date()
    
    // Initialize last 5 months
    for (let i = 4; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' })
      monthlyData[monthKey] = 0
    }

    // Aggregate emissions by month
    emissions.forEach((emission) => {
      const date = new Date(emission.createdAt)
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' })
      if (monthKey in monthlyData) {
        monthlyData[monthKey] += emission.co2 / 1000
      }
    })

    return Object.entries(monthlyData).map(([name, emissions]) => ({
      name,
      emissions: Math.round(emissions * 100) / 100
    }))
  })()

  // Format leaderboard data - ADD userId to entries and include accountType
  const leaderboardEntries = leaderboardData.map((entry) => {
    const monthlyDelta = computeMonthlyChange(entry.totalEmissions, entry.monthlyEmissions)

    return {
      rank: entry.rank,
      name: entry.userName,
      emissions: entry.totalEmissions / 1000, // Convert to kg
      reduction: parseFloat(monthlyDelta.toFixed(1)),
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
    ? (relevantLeaderboard[0].totalEmissions / 1000)
    : 0

  const userCategoryDisplay = userAccountType === 'individual' ? 'Individual' : userAccountType === 'company' ? 'Company' : 'City'

  const comparisonData = {
    userData: { name: "You", emissions: totalEmissions },
    averageData: { name: `${userCategoryDisplay} Average`, emissions: averageEmissions },
    topPerformerData: { name: `Top ${userCategoryDisplay}`, emissions: topPerformerEmissions },
  }

  const topCategory = categoryData.length > 0 
    ? categoryData.reduce((max, curr) => curr.value > max.value ? curr : max).name 
    : "transportation"

  if (isPending || isLoadingEmissions || isLoadingStats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

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
                  <a href="/dashboard" className="text-lg font-semibold text-primary">Dashboard</a>
                  <a href="/social" className="text-lg hover:text-primary">Social</a>
                  <a href="/gamification" className="text-lg hover:text-primary">Gamification</a>
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
            <a href="/dashboard" className="text-sm font-semibold text-primary">
              Dashboard
            </a>
            <a href="/social" className="text-sm hover:text-primary transition-colors">
              Social
            </a>
            <a href="/gamification" className="text-sm hover:text-primary transition-colors">
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
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile Settings</span>
                </DropdownMenuItem>
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
          {/* Dashboard Summary */}
          <DashboardSummary
            userId={session.user.id}
            totalEmissions={totalEmissions}
            monthlyChange={monthlyChange}
            topCategory={topCategory}
          />

          {/* Stats */}
          <DashboardStats
            totalEmissions={userStats?.totalEmissions || 0}
            monthlyChange={monthlyChange}
            rank={rank}
            treesEquivalent={treesEquivalent}
            grossEmissions={userStats?.grossEmissions || 0}
            carbonOffset={userStats?.carbonOffset || 0}
            onDataChange={() => refreshData(session.user.id)}
          />

          {/* Main Dashboard Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <EmissionInputForm onSubmit={handleEmissionSubmit} userAccountType={userProfile?.accountType || "individual"} />
                <ComparisonChart {...comparisonData} />
              </div>
              
              <EmissionCharts
                categoryData={categoryData}
                timelineData={timelineData}
                totalEmissions={totalEmissions}
              />
              
              <Badges userId={session.user.id} triggerRefresh={badgeRefreshTrigger} />
            </TabsContent>

            <TabsContent value="leaderboard" className="space-y-6">
              {isLoadingLeaderboard ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading leaderboard...</p>
                </div>
              ) : (
                <Leaderboard 
                  entries={leaderboardEntries} 
                  currentUserRank={rank}
                  currentUserAccountType={userProfile?.accountType || "individual"}
                />
              )}
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <PersonalizedInsights 
                userId={session.user.id} 
                triggerRefresh={insightsRefreshTrigger}
              />
            </TabsContent>

            <TabsContent value="assistant" className="space-y-6">
              <CarbonChatbot />
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