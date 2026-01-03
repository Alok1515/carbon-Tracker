"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Volume2, VolumeX, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface DashboardSummaryProps {
  userId: string
  totalEmissions: number
  monthlyChange: number
  topCategory: string
}

export function DashboardSummary({ 
  userId,
  totalEmissions, 
  monthlyChange, 
  topCategory 
}: DashboardSummaryProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [summary, setSummary] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  const fetchAiSummary = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, totalEmissions, monthlyChange, topCategory }),
      })
      const data = await response.json()
      if (data.summary) {
        setSummary(data.summary)
      } else {
        setSummary(fallbackSummary())
      }
    } catch (error) {
      console.error("Failed to fetch AI summary:", error)
      setSummary(fallbackSummary())
    } finally {
      setIsLoading(false)
    }
  }

  const fallbackSummary = () => {
    const trend = monthlyChange < 0 ? "decreased" : "increased"
    const trendEmoji = monthlyChange < 0 ? "📉" : "📈"
    const sentiment = monthlyChange < 0 ? "excellent progress" : "room for improvement"
    
    return `${trendEmoji} Your carbon footprint this month is ${totalEmissions.toFixed(1)}kg CO2, which has ${trend} by ${Math.abs(monthlyChange).toFixed(1)}% compared to last month. This shows ${sentiment}! Your highest emission category is ${topCategory}.`
  }

  useEffect(() => {
    if (userId) {
      fetchAiSummary()
    }
  }, [userId, totalEmissions, monthlyChange, topCategory])

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel()
        setIsSpeaking(false)
      } else {
        const utterance = new SpeechSynthesisUtterance(summary)
        utterance.onend = () => setIsSpeaking(false)
        window.speechSynthesis.speak(utterance)
        setIsSpeaking(true)
      }
    }
  }

  return (
    <Card className="bg-gradient-to-br from-indigo-50 via-blue-50 to-emerald-50 dark:from-indigo-950/40 dark:via-blue-950/40 dark:to-emerald-950/40 border-blue-200/50 dark:border-blue-800/50 shadow-lg backdrop-blur-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 p-1 opacity-10 pointer-events-none">
        <Sparkles className="h-24 w-24 text-blue-500" />
      </div>
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-blue-950 dark:text-blue-50 flex items-center gap-2">
                AI Sustainability Expert
              </CardTitle>
              <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70 font-medium uppercase tracking-wider">Powered by CarbonTrack AI</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchAiSummary}
              disabled={isLoading}
              className="h-8 w-8 p-0 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
            >
              <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSpeak}
              disabled={isLoading}
              className="h-8 w-8 p-0 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
            >
              {isSpeaking ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2 py-2">
            <div className="h-4 bg-blue-200/50 dark:bg-blue-800/50 rounded animate-pulse w-full"></div>
            <div className="h-4 bg-blue-200/50 dark:bg-blue-800/50 rounded animate-pulse w-[90%]"></div>
            <div className="h-4 bg-blue-200/50 dark:bg-blue-800/50 rounded animate-pulse w-[75%]"></div>
          </div>
        ) : (
          <p className="text-sm md:text-base leading-relaxed text-blue-900 dark:text-blue-100 font-medium italic">
            "{summary}"
          </p>
        )}
        
        <div className="mt-6 grid grid-cols-3 gap-3 md:gap-4">
          <div className="bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-blue-100/50 dark:border-blue-900/50 text-center backdrop-blur-sm transition-all hover:scale-105 duration-300">
            <p className="text-2xl mb-1">
              {totalEmissions < 100 ? "🌟" : totalEmissions < 200 ? "⭐" : "🌍"}
            </p>
            <p className="text-[10px] font-bold text-blue-600/70 dark:text-blue-400/70 uppercase tracking-tighter">Status</p>
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">
              {totalEmissions < 100 ? "Eco-Hero" : totalEmissions < 200 ? "Sustainable" : "Tracking"}
            </p>
          </div>
          <div className="bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-blue-100/50 dark:border-blue-900/50 text-center backdrop-blur-sm transition-all hover:scale-105 duration-300">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              {monthlyChange < -15 ? "A+" : monthlyChange < -5 ? "A" : monthlyChange < 0 ? "B" : monthlyChange < 10 ? "C" : "D"}
            </p>
            <p className="text-[10px] font-bold text-blue-600/70 dark:text-blue-400/70 uppercase tracking-tighter">Grade</p>
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">Efficiency</p>
          </div>
          <div className="bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-blue-100/50 dark:border-blue-900/50 text-center backdrop-blur-sm transition-all hover:scale-105 duration-300">
            <p className={cn(
              "text-xl font-bold mb-1",
              monthlyChange <= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
            )}>
              {monthlyChange <= 0 ? "↓" : "↑"}{Math.abs(monthlyChange).toFixed(0)}%
            </p>
            <p className="text-[10px] font-bold text-blue-600/70 dark:text-blue-400/70 uppercase tracking-tighter">Trend</p>
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">This Month</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
