"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BookOpen, 
  Leaf, 
  Calculator, 
  Target, 
  ChevronDown,
  ChevronRight,
  TrendingDown,
  Zap,
  Bot,
  Camera,
  Trophy,
  Users,
  Sparkles,
  BarChart3,
  Car,
  Plane,
  Utensils,
  Factory,
  Building,
  Home
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function DocsPage() {
  const [expandedSections, setExpandedSections] = useState<string[]>([])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const emissionFactors = [
    {
      category: "Transportation",
      icon: <Car className="h-5 w-5" />,
      factors: [
        { subcategory: "Car - Gasoline", factor: "0.251 kg CO₂/km", accuracy: "±10%" },
        { subcategory: "Car - Diesel", factor: "0.228 kg CO₂/km", accuracy: "±10%" },
        { subcategory: "Car - Electric", factor: "0.053 kg CO₂/km", accuracy: "±15%" },
        { subcategory: "Car - Hybrid", factor: "0.109 kg CO₂/km", accuracy: "±12%" },
        { subcategory: "Motorcycle", factor: "0.103 kg CO₂/km", accuracy: "±12%" },
        { subcategory: "Bus", factor: "0.089 kg CO₂/km", accuracy: "±15%" },
        { subcategory: "Train", factor: "0.041 kg CO₂/km", accuracy: "±10%" },
        { subcategory: "Subway/Metro", factor: "0.028 kg CO₂/km", accuracy: "±10%" },
        { subcategory: "Bicycle", factor: "0.005 kg CO₂/km", accuracy: "±5%" },
      ]
    },
    {
      category: "Flights",
      icon: <Plane className="h-5 w-5" />,
      factors: [
        { subcategory: "Domestic - Economy", factor: "0.255 kg CO₂/km", accuracy: "±15%" },
        { subcategory: "Domestic - Business", factor: "0.384 kg CO₂/km", accuracy: "±15%" },
        { subcategory: "Short-haul - Economy", factor: "0.195 kg CO₂/km", accuracy: "±15%" },
        { subcategory: "Long-haul - Economy", factor: "0.195 kg CO₂/km", accuracy: "±12%" },
        { subcategory: "Long-haul - Business", factor: "0.585 kg CO₂/km", accuracy: "±12%" },
        { subcategory: "Long-haul - First", factor: "0.780 kg CO₂/km", accuracy: "±12%" },
      ]
    },
    {
      category: "Electricity",
      icon: <Zap className="h-5 w-5" />,
      factors: [
        { subcategory: "US Grid Average", factor: "0.429 kg CO₂/kWh", accuracy: "±8%" },
        { subcategory: "UK Grid Average", factor: "0.233 kg CO₂/kWh", accuracy: "±8%" },
        { subcategory: "EU Grid Average", factor: "0.295 kg CO₂/kWh", accuracy: "±10%" },
        { subcategory: "Solar Power", factor: "0.045 kg CO₂/kWh", accuracy: "±20%" },
        { subcategory: "Wind Power", factor: "0.011 kg CO₂/kWh", accuracy: "±20%" },
        { subcategory: "Nuclear Power", factor: "0.012 kg CO₂/kWh", accuracy: "±15%" },
      ]
    },
    {
      category: "Food",
      icon: <Utensils className="h-5 w-5" />,
      factors: [
        { subcategory: "Beef", factor: "27.0 kg CO₂/kg", accuracy: "±20%" },
        { subcategory: "Lamb", factor: "24.0 kg CO₂/kg", accuracy: "±20%" },
        { subcategory: "Pork", factor: "7.2 kg CO₂/kg", accuracy: "±15%" },
        { subcategory: "Chicken", factor: "6.1 kg CO₂/kg", accuracy: "±15%" },
        { subcategory: "Fish", factor: "5.0 kg CO₂/kg", accuracy: "±15%" },
        { subcategory: "Cheese", factor: "13.5 kg CO₂/kg", accuracy: "±15%" },
        { subcategory: "Milk", factor: "1.9 kg CO₂/liter", accuracy: "±10%" },
        { subcategory: "Vegetables", factor: "0.5 kg CO₂/kg", accuracy: "±15%" },
      ]
    },
    {
      category: "Manufacturing",
      icon: <Factory className="h-5 w-5" />,
      factors: [
        { subcategory: "Steel Production", factor: "2.3 kg CO₂/kg", accuracy: "±12%" },
        { subcategory: "Aluminum Production", factor: "11.5 kg CO₂/kg", accuracy: "±15%" },
        { subcategory: "Plastic Production", factor: "3.5 kg CO₂/kg", accuracy: "±15%" },
        { subcategory: "Cement Production", factor: "0.9 kg CO₂/kg", accuracy: "±10%" },
        { subcategory: "Paper Production", factor: "1.2 kg CO₂/kg", accuracy: "±12%" },
      ]
    },
    {
      category: "Heating",
      icon: <Home className="h-5 w-5" />,
      factors: [
        { subcategory: "Natural Gas", factor: "0.203 kg CO₂/kWh", accuracy: "±8%" },
        { subcategory: "Heating Oil", factor: "0.298 kg CO₂/liter", accuracy: "±10%" },
        { subcategory: "Electric Heat", factor: "0.429 kg CO₂/kWh", accuracy: "±10%" },
        { subcategory: "Heat Pump", factor: "0.143 kg CO₂/kWh", accuracy: "±12%" },
      ]
    }
  ]

  const features = [
    {
      title: "Real-Time Emission Tracking",
      icon: <BarChart3 className="h-6 w-6" />,
      description: "Track your carbon emissions across multiple categories",
      details: [
        "Log transportation, energy, food, and waste emissions",
        "Automatic CO₂ calculations using verified emission factors",
        "Real-time dashboard updates with interactive charts",
        "Historical data analysis and trend visualization"
      ]
    },
    {
      title: "AI-Powered Chatbot",
      icon: <Bot className="h-6 w-6" />,
      description: "Get personalized carbon reduction tips 24/7",
      details: [
        "Ask questions about sustainability and carbon emissions",
        "Receive personalized recommendations based on your data",
        "Learn about emission factors and reduction strategies",
        "Context-aware responses based on your emission history"
      ]
    },
    {
      title: "Image-Based Estimation",
      icon: <Camera className="h-6 w-6" />,
      description: "Upload photos for AI-powered emission analysis",
      details: [
        "Upload receipts or product photos",
        "AI object detection identifies items automatically",
        "Instant carbon footprint estimation",
        "Save detected emissions directly to your profile"
      ]
    },
    {
      title: "Natural Language Insights",
      icon: <Sparkles className="h-6 w-6" />,
      description: "Get plain-English AI summaries of your dashboard",
      details: [
        "AI analyzes your emission patterns",
        "Plain-English summaries of complex data",
        "Actionable recommendations for reduction",
        "Monthly and weekly insights generation"
      ]
    },
    {
      title: "Gamification & Rewards",
      icon: <Trophy className="h-6 w-6" />,
      description: "Earn badges, complete quests, and climb leaderboards",
      details: [
        "Complete daily quests to earn quest points",
        "Unlock achievements and badges for milestones",
        "Compete on global, regional, and friend leaderboards",
        "Spend quest points in the rewards shop"
      ]
    },
    {
      title: "Multi-Level Tracking",
      icon: <Users className="h-6 w-6" />,
      description: "Track emissions at individual, company, or city level",
      details: [
        "Individual tracking for personal carbon footprint",
        "Company-level tracking for organizations",
        "City-level tracking for municipalities",
        "Product lifecycle analysis (LCA) support"
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span className="group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">🌍</span>
              <span className="group-hover:text-green-600 transition-colors duration-300">CarbonTrack</span>
            </h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">Home</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 dark:from-green-950 dark:via-blue-950 dark:to-emerald-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <Badge className="mb-2" variant="secondary">
              <BookOpen className="h-4 w-4 mr-2" />
              Documentation
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              How <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">CarbonTrack</span> Works
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Learn everything about our carbon tracking system, emission calculation methods, precision rates, and the science behind our platform.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 container mx-auto px-4">
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-4 h-auto bg-transparent">
            <TabsTrigger value="overview" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Leaf className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="features" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Sparkles className="h-4 w-4 mr-2" />
              Features
            </TabsTrigger>
            <TabsTrigger value="calculations" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Calculator className="h-4 w-4 mr-2" />
              Calculations
            </TabsTrigger>
            <TabsTrigger value="precision" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Target className="h-4 w-4 mr-2" />
              Precision
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-green-600" />
                  What is CarbonTrack?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  CarbonTrack is a comprehensive carbon footprint tracking platform that helps individuals, companies, and cities measure, analyze, and reduce their environmental impact. Using industry-standard emission factors from IPCC, EPA, and DEFRA, we provide accurate carbon calculations across multiple categories.
                </p>
                
                <div className="grid md:grid-cols-3 gap-4 pt-4">
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        For Individuals
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Track your personal carbon footprint across transportation, energy, food, and waste
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Building className="h-5 w-5 text-purple-600" />
                        For Companies
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Monitor organizational emissions, supply chain impact, and sustainability goals
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Home className="h-5 w-5 text-orange-600" />
                        For Cities
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Track municipal emissions, public transport, buildings, and waste management
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-6 w-6 text-green-600" />
                  Why Track Carbon Emissions?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {[
                    "Understand your environmental impact with data-driven insights",
                    "Identify high-emission activities and opportunities for reduction",
                    "Make informed decisions about sustainable alternatives",
                    "Track progress toward carbon neutrality goals",
                    "Contribute to global climate action initiatives",
                    "Meet regulatory compliance and reporting requirements"
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <span className="text-green-600 text-xs">✓</span>
                      </div>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <div className="grid gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="border-2 hover:border-green-600 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900 dark:to-green-950 flex items-center justify-center text-green-600">
                        {feature.icon}
                      </div>
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="font-semibold text-sm">Key Capabilities:</p>
                      <ul className="space-y-2">
                        {feature.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <ChevronRight className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-muted-foreground">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-green-600" />
                  Additional Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { title: "Daily Quests", desc: "Complete challenges to build sustainable habits" },
                    { title: "Rewards Shop", desc: "Spend quest points on avatars and badges" },
                    { title: "Tree Planting Tracker", desc: "Visualize impact with tree equivalents" },
                    { title: "Interactive Charts", desc: "Beautiful data visualizations" },
                    { title: "Profile Customization", desc: "Personalize with items and avatars" },
                    { title: "Achievement Badges", desc: "Unlock milestones and special badges" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-background rounded-lg">
                      <div className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-green-600" />
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calculations Tab */}
          <TabsContent value="calculations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-6 w-6 text-green-600" />
                  Emission Calculation Methodology
                </CardTitle>
                <CardDescription>
                  Our calculations use internationally recognized emission factors from leading climate organizations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Data Sources</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">IPCC</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">
                          Intergovernmental Panel on Climate Change - Global emission factors and guidelines
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">EPA</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">
                          Environmental Protection Agency - US-specific emission data and standards
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">DEFRA</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">
                          UK Department for Environment, Food & Rural Affairs - Comprehensive conversion factors
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Calculation Formula</h3>
                  <Card className="bg-muted">
                    <CardContent className="pt-6">
                      <code className="text-sm">
                        <span className="text-green-600 font-semibold">CO₂ Emissions (kg)</span> = 
                        <span className="text-blue-600"> Activity Value</span> × 
                        <span className="text-purple-600"> Emission Factor</span>
                      </code>
                      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                        <p><strong>Activity Value:</strong> The quantity of activity (e.g., km driven, kWh consumed)</p>
                        <p><strong>Emission Factor:</strong> Standard CO₂ emission per unit of activity</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Example Calculation</h3>
                  <Card className="border-2 border-green-200 dark:border-green-800">
                    <CardContent className="pt-6 space-y-3">
                      <p className="font-medium">Driving a gasoline car 100 km:</p>
                      <div className="pl-4 space-y-2 text-sm text-muted-foreground">
                        <p>• Activity: 100 km driven</p>
                        <p>• Emission Factor: 0.251 kg CO₂/km (gasoline car)</p>
                        <p>• Calculation: 100 km × 0.251 kg CO₂/km = <span className="text-green-600 font-bold">25.1 kg CO₂</span></p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-6 w-6 text-green-600" />
                  Emission Factors by Category
                </CardTitle>
                <CardDescription>
                  Comprehensive list of emission factors used in our calculations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {emissionFactors.map((category, index) => (
                  <div key={index} className="space-y-3">
                    <button
                      onClick={() => toggleSection(category.category)}
                      className="w-full flex items-center justify-between p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-green-600">
                          {category.icon}
                        </div>
                        <span className="font-semibold">{category.category}</span>
                        <Badge variant="secondary">{category.factors.length} factors</Badge>
                      </div>
                      {expandedSections.includes(category.category) ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </button>
                    
                    {expandedSections.includes(category.category) && (
                      <div className="pl-4 space-y-2">
                        {category.factors.map((factor, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-background border">
                            <span className="text-sm">{factor.subcategory}</span>
                            <div className="flex items-center gap-4">
                              <Badge variant="outline" className="font-mono">{factor.factor}</Badge>
                              <Badge variant="secondary" className="text-xs">±{factor.accuracy}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Precision Tab */}
          <TabsContent value="precision" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-6 w-6 text-green-600" />
                  Precision & Accuracy Rates
                </CardTitle>
                <CardDescription>
                  Understanding the accuracy of our emission calculations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Overall System Accuracy</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card className="border-2 border-green-200 dark:border-green-800">
                      <CardHeader>
                        <CardTitle className="text-2xl text-green-600">85-95%</CardTitle>
                        <CardDescription>Manual Entry</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          High accuracy when users provide precise activity data
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-2 border-blue-200 dark:border-blue-800">
                      <CardHeader>
                        <CardTitle className="text-2xl text-blue-600">70-85%</CardTitle>
                        <CardDescription>AI Image Analysis</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Good accuracy with AI object detection and estimation
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-2 border-purple-200 dark:border-purple-800">
                      <CardHeader>
                        <CardTitle className="text-2xl text-purple-600">75-90%</CardTitle>
                        <CardDescription>Average Estimates</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Reliable accuracy using regional and category averages
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Factors Affecting Precision</h3>
                  <div className="space-y-3">
                    {[
                      {
                        title: "Data Quality",
                        desc: "More specific input data leads to higher accuracy",
                        impact: "High Impact"
                      },
                      {
                        title: "Regional Variations",
                        desc: "Emission factors vary by location and grid mix",
                        impact: "Medium Impact"
                      },
                      {
                        title: "Activity Specificity",
                        desc: "Generic vs. specific activity categories affect precision",
                        impact: "Medium Impact"
                      },
                      {
                        title: "Time Factors",
                        desc: "Seasonal variations and time-of-day energy mix",
                        impact: "Low Impact"
                      },
                      {
                        title: "AI Detection Confidence",
                        desc: "Image quality and object recognition accuracy",
                        impact: "Variable"
                      }
                    ].map((item, index) => (
                      <Card key={index}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <p className="font-medium">{item.title}</p>
                              <p className="text-sm text-muted-foreground">{item.desc}</p>
                            </div>
                            <Badge variant="outline">{item.impact}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Uncertainty Ranges</h3>
                  <Card className="bg-muted">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Transportation (Direct Measurement)</span>
                            <Badge variant="secondary">±8-12%</Badge>
                          </div>
                          <div className="w-full bg-background rounded-full h-2">
                            <div className="bg-green-600 h-2 rounded-full" style={{width: "90%"}}></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Electricity (Grid-Based)</span>
                            <Badge variant="secondary">±8-15%</Badge>
                          </div>
                          <div className="w-full bg-background rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{width: "85%"}}></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Food (Supply Chain Estimates)</span>
                            <Badge variant="secondary">±15-20%</Badge>
                          </div>
                          <div className="w-full bg-background rounded-full h-2">
                            <div className="bg-yellow-600 h-2 rounded-full" style={{width: "80%"}}></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>AI Image Detection</span>
                            <Badge variant="secondary">±20-30%</Badge>
                          </div>
                          <div className="w-full bg-background rounded-full h-2">
                            <div className="bg-purple-600 h-2 rounded-full" style={{width: "75%"}}></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-2 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-amber-600" />
                      Important Disclaimer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      All emission calculations are estimates based on industry-standard factors and methodologies. Actual emissions may vary based on specific circumstances, regional factors, and individual behavior. Our platform is designed for awareness, education, and general tracking purposes. For official carbon reporting and compliance, please consult certified environmental auditors.
                    </p>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-6 w-6 text-green-600" />
                  Improving Accuracy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    You can improve the accuracy of your carbon footprint tracking by:
                  </p>
                  <ul className="space-y-3">
                    {[
                      "Providing specific activity data (exact km, kWh, kg) rather than estimates",
                      "Using manual entry for the most accurate calculations",
                      "Selecting region-specific emission factors when available",
                      "Regularly updating your profile with current consumption patterns",
                      "Using AI image detection as a supplement, not primary source",
                      "Cross-checking with utility bills and actual consumption data"
                    ].map((tip, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          <span className="text-green-600 text-xs">✓</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 text-white">
        <div className="container mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to Start Tracking?
          </h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Join thousands of users making a difference with data-driven carbon reduction
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" variant="secondary" className="text-lg">
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline" className="bg-white/10 text-white border-white hover:bg-white/20">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌍</span>
              <span className="font-bold text-lg">CarbonTrack</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 CarbonTrack. Making the world more sustainable, one action at a time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
