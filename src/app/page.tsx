"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { authClient, useSession, logout } from "@/lib/auth-client"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LoginDialog } from "@/components/auth/LoginDialog"
import { RegisterDialog } from "@/components/auth/RegisterDialog"

import { 
  Leaf, 
  TrendingDown, 
  Trophy, 
  Bot, 
  BarChart3, 
  Users, 
  Target,
  Zap,
  Camera,
  Sparkles,
  ArrowRight,
  Check,
  LogOut,
  User,
  Sprout,
  TreeDeciduous,
  Flower2,
  Wind
} from "lucide-react"

// Register ScrollTrigger
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

// Helper for seeded random to ensure consistent layout between SSR and Client
const seededRandom = (seed: number) => {
  let value = seed % 2147483647
  if (value <= 0) value += 2147483646
  return () => {
    value = (value * 16807) % 2147483647
    return (value - 1) / 2147483646
  }
}

const generateNatureFloaters = (count: number, seed: number) => {
  const rand = seededRandom(seed)
  const types = ["leaf", "sprout", "tree", "flower", "wind"]
  return Array.from({ length: count }, (_, i) => ({
    left: `${(rand() * 100).toFixed(2)}%`,
    top: `${(rand() * 100).toFixed(2)}%`,
    type: types[Math.floor(rand() * types.length)],
    scale: (0.5 + rand() * 1).toFixed(2),
    rotation: (rand() * 360).toFixed(2),
    opacity: (0.1 + rand() * 0.3).toFixed(2),
  }))
}

const generateOrbFloaters = (count: number, seed: number) => {
  const rand = seededRandom(seed)
  return Array.from({ length: count }, (_, i) => ({
    width: `${(rand() * 400 + 200).toFixed(2)}px`,
    height: `${(rand() * 400 + 200).toFixed(2)}px`,
    left: `${(rand() * 100).toFixed(2)}%`,
    top: `${(rand() * 100).toFixed(2)}%`,
    background: i % 2 === 0 
      ? "radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)" 
      : "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)",
  }))
}

const generateCtaFloaters = (count: number, seed: number) => {
  const rand = seededRandom(seed)
  return Array.from({ length: count }, (_, i) => ({
    width: `${(rand() * 20 + 5).toFixed(2)}px`,
    height: `${(rand() * 20 + 5).toFixed(2)}px`,
    left: `${(rand() * 100).toFixed(2)}%`,
    top: `${(rand() * 100).toFixed(2)}%`,
  }))
}

const NATURE_FLOATERS = generateNatureFloaters(20, 42)
const ORB_FLOATERS = generateOrbFloaters(8, 84)
const CTA_FLOATS = generateCtaFloaters(30, 126)

const FEATURES_DATA = [
  {
    icon: <BarChart3 className="h-8 w-8" />,
    title: "Real-Time Tracking",
    description: "Monitor your carbon emissions across transportation, energy, food, and waste with intuitive visualizations and interactive charts.",
    color: "text-blue-600",
    badge: "Core Feature"
  },
  {
    icon: <Trophy className="h-8 w-8" />,
    title: "Gamification & Leaderboards",
    description: "Compete globally, earn badges, achievements, and climb the rankings as you reduce your carbon footprint.",
    color: "text-yellow-600",
    badge: "Popular"
  },
  {
    icon: <Bot className="h-8 w-8" />,
    title: "AI-Powered Chatbot",
    description: "Get instant personalized carbon reduction tips and answers to your sustainability questions 24/7.",
    color: "text-purple-600",
    badge: "AI Powered"
  },
  {
    icon: <Camera className="h-8 w-8" />,
    title: "Image-Based Estimation",
    description: "Upload receipts or photos to automatically estimate carbon emissions from your purchases using AI.",
    color: "text-green-600",
    badge: "AI Powered"
  },
  {
    icon: <Sparkles className="h-8 w-8" />,
    title: "Natural Language Insights",
    description: "Get plain-English AI summaries of your dashboard with personalized analysis and actionable recommendations.",
    color: "text-indigo-600",
    badge: "AI Powered"
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: "Multi-Level Tracking",
    description: "Track emissions at individual, company, or city level - perfect for organizations of any scale.",
    color: "text-orange-600",
    badge: "Enterprise"
  },
  {
    icon: <Target className="h-8 w-8" />,
    title: "Daily Quests System",
    description: "Complete daily challenges to earn quest points, unlock rewards, and build sustainable habits.",
    color: "text-pink-600",
    badge: "Engaging"
  },
  {
    icon: <Zap className="h-8 w-8" />,
    title: "Rewards Shop",
    description: "Spend quest points on exclusive profile items, avatars, and badges in our gamified rewards marketplace.",
    color: "text-cyan-600",
    badge: "New"
  },
  {
    icon: <Leaf className="h-8 w-8" />,
    title: "Tree Planting Tracker",
    description: "Visualize your impact with tree planting equivalents and track your contribution to reforestation.",
    color: "text-emerald-600",
    badge: "Impact"
  },
  {
    icon: <BarChart3 className="h-8 w-8" />,
    title: "Interactive Visualizations",
    description: "Explore your data with beautiful charts, graphs, and visual analytics for deeper insights.",
    color: "text-violet-600",
    badge: "Analytics"
  },
  {
    icon: <Trophy className="h-8 w-8" />,
    title: "Achievements & Badges",
    description: "Unlock special badges and achievements as you hit milestones and complete sustainability challenges.",
    color: "text-amber-600",
    badge: "Rewarding"
  },
  {
    icon: <User className="h-8 w-8" />,
    title: "Profile Customization",
    description: "Personalize your profile with custom avatars, items, and showcase your environmental achievements.",
    color: "text-rose-600",
    badge: "Customize"
  }
]

const STATS_DATA = [
  { value: "50K+", label: "Active Users", icon: <Users className="h-5 w-5" /> },
  { value: "2.5M kg", label: "CO2 Reduced", icon: <TrendingDown className="h-5 w-5" /> },
  { value: "120K", label: "Trees Equivalent", icon: <Leaf className="h-5 w-5" /> },
  { value: "95%", label: "User Success Rate", icon: <Trophy className="h-5 w-5" /> }
]

const BENEFITS_DATA = [
  "AI-based emission estimation",
  "Interactive dashboards with charts",
  "Personalized reduction strategies",
  "Community leaderboards",
  "Achievement badges & rewards",
  "Image recognition for receipts",
  "Natural language summaries",
  "Multi-level tracking (Individual/Company/City)"
]

const HOW_IT_WORKS_DATA = [
  { step: "1", title: "Sign Up", description: "Create your free account in seconds", icon: <Users className="h-6 w-6" />, color: "from-blue-500 to-blue-600" },
  { step: "2", title: "Track", description: "Log your daily activities and emissions", icon: <BarChart3 className="h-6 w-6" />, color: "from-green-500 to-green-600" },
  { step: "3", title: "Analyze", description: "Get AI-powered insights and tips", icon: <Bot className="h-6 w-6" />, color: "from-purple-500 to-purple-600" },
  { step: "4", title: "Reduce", description: "Take action and watch your impact shrink", icon: <TrendingDown className="h-6 w-6" />, color: "from-orange-500 to-orange-600" }
]

export default function Home() {
  const router = useRouter()
  const { data: session, isPending, refetch } = useSession()
  const [loginOpen, setLoginOpen] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
  const container = useRef<HTMLDivElement>(null)

  // Combined effect for all side effects to maintain hook stability
  useEffect(() => {
    // Force a refresh when session state stabilizes or layout shifts
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    const handleResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", handleResize);
    
    // Additional refresh after a longer delay for slow-loading content
    const longTimer = setTimeout(() => ScrollTrigger.refresh(), 1000);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(longTimer);
      window.removeEventListener("resize", handleResize);
    }
  }, [isPending]);

  useGSAP(() => {
    if (!container.current) return;

    // Set initial states to prevent flashes and ensure visibility if GSAP fails
    gsap.set(".gsap-feature-card, .gsap-step-card, .gsap-benefit-card, .gsap-hero-bg", {
      opacity: 0,
      y: 40,
      visibility: "visible"
    });

    // 1. Hero Floating Elements
    gsap.to(".gsap-nature", {
      y: "random(-40, 40)",
      x: "random(-40, 40)",
      rotation: "+=random(45, 180)",
      duration: "random(4, 8)",
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: { amount: 3, from: "random" }
    })

    gsap.to(".gsap-orb", {
      scale: "random(0.8, 1.4)",
      opacity: "random(0.1, 0.4)",
      duration: "random(5, 10)",
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    })

    // 2. Hero Text Entrance
    const tl = gsap.timeline({ 
      onComplete: () => ScrollTrigger.refresh() 
    })
    tl.to(".gsap-hero-bg", { y: 0, opacity: 1, duration: 1.2, ease: "power3.out" })
      .from(".gsap-hero-badge", { y: -30, opacity: 0, duration: 1, ease: "back.out(1.7)" }, "-=0.8")
      .from(".gsap-hero-title", { y: 50, opacity: 0, duration: 1.2, ease: "power4.out" }, "-=0.6")
      .from(".gsap-hero-desc", { y: 30, opacity: 0, duration: 1, ease: "power3.out" }, "-=0.8")
      .from(".gsap-hero-cta", { scale: 0.5, opacity: 0, duration: 0.8, ease: "back.out(1.7)" }, "-=0.6")
      .from(".gsap-hero-stat", { y: 40, opacity: 0, duration: 0.8, stagger: 0.15, ease: "power2.out" }, "-=0.6")

    // 3. Scroll Animations using Batch for better performance and reliability
    ScrollTrigger.batch(".gsap-feature-card", {
      onEnter: (elements) => {
        gsap.to(elements, {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power2.out",
          overwrite: true
        });
      },
      onLeaveBack: (elements) => {
        gsap.to(elements, {
          y: 40,
          opacity: 0,
          scale: 0.95,
          duration: 0.5,
          overwrite: true
        });
      },
      start: "top bottom-=50px",
    });

    ScrollTrigger.batch(".gsap-step-card", {
      onEnter: (elements) => {
        gsap.to(elements, {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          overwrite: true
        });
      },
      onLeaveBack: (elements) => {
        gsap.to(elements, {
          y: 30,
          opacity: 0,
          duration: 0.4,
          overwrite: true
        });
      },
      start: "top bottom-=50px",
    });

    ScrollTrigger.batch(".gsap-benefit-card", {
      onEnter: (elements) => {
        gsap.to(elements, {
          x: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power2.out",
          overwrite: true
        });
      },
      onLeaveBack: (elements) => {
        gsap.to(elements, {
          x: 30,
          opacity: 0,
          duration: 0.6,
          overwrite: true
        });
      },
      start: "top bottom-=50px",
    });

    // 4. CTA Floating Particles
    gsap.to(".gsap-cta-particle", {
      y: "random(-150, 150)",
      x: "random(-100, 100)",
      opacity: "random(0.1, 0.5)",
      duration: "random(8, 15)",
      repeat: -1,
      yoyo: true,
      ease: "none"
    })

    // 5. Falling leaves
    gsap.to(".gsap-falling-leaf", {
      scrollTrigger: { 
        trigger: container.current, 
        start: "top top", 
        end: "bottom bottom", 
        scrub: 1 
      },
      y: "100vh", 
      rotation: 360, 
      x: (i) => i % 2 === 0 ? "+=100" : "-=100", 
      ease: "none"
    })

    // Refresh everything once animations are registered
    ScrollTrigger.refresh();
  }, { scope: container })

  const handleSignOut = async () => {
    await logout()
    await refetch()
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background" ref={container}>
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} onSwitchToRegister={() => { setLoginOpen(false); setRegisterOpen(true); }} />
      <RegisterDialog open={registerOpen} onOpenChange={setRegisterOpen} onSwitchToLogin={() => { setRegisterOpen(false); setLoginOpen(true); }} />

      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span className="group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">🌍</span>
              <span className="group-hover:text-green-600 transition-colors duration-300">CarbonTrack</span>
            </h1>
          </Link>

          <div className="flex items-center gap-4">
            {isPending ? (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                Loading...
              </div>
            ) : session?.user ? (
              <>
                <Link href="/dashboard"><Button variant="ghost" size="sm">Dashboard</Button></Link>
                <Link href="/social"><Button variant="ghost" size="sm">Social</Button></Link>
                <Link href="/gamification"><Button variant="ghost" size="sm">Gamification</Button></Link>
                <Link href="/docs"><Button variant="ghost" size="sm">Docs</Button></Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><User className="h-5 w-5" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{session.user.name}</p>
                        <p className="text-xs text-muted-foreground">{session.user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}><LogOut className="mr-2 h-4 w-4" /><span>Sign out</span></DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/docs"><Button variant="ghost" size="sm">Docs</Button></Link>
                <Button variant="ghost" size="sm" onClick={() => setLoginOpen(true)}>Sign In</Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setRegisterOpen(true)}>Get Started</Button>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 dark:from-green-950 dark:via-blue-950 dark:to-emerald-950 transition-colors duration-300 gsap-hero-bg" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {(NATURE_FLOATERS || []).map((item, i) => (
            <div key={i} className="absolute gsap-nature" style={{ left: item.left, top: item.top, opacity: item.opacity, transform: `scale(${item.scale}) rotate(${item.rotation}deg)` }}>
              {item.type === "leaf" && <Leaf className="h-8 w-8 text-green-600" />}
              {item.type === "sprout" && <Sprout className="h-8 w-8 text-emerald-600" />}
              {item.type === "tree" && <TreeDeciduous className="h-10 w-10 text-green-700" />}
              {item.type === "flower" && <Flower2 className="h-6 w-6 text-emerald-500" />}
              {item.type === "wind" && <Wind className="h-12 w-12 text-blue-400 opacity-20" />}
            </div>
          ))}
          {(ORB_FLOATERS || []).map((item, i) => (
            <div key={`orb-${i}`} className="absolute gsap-orb rounded-full blur-3xl" style={{ width: item.width, height: item.height, left: item.left, top: item.top, background: item.background }} />
          ))}
        </div>

        <div className="relative container mx-auto px-4 pt-12 pb-2">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <Badge className="mb-4 gsap-hero-badge" variant="secondary"><Sparkles className="h-3 w-3 mr-1" />AI-Powered Carbon Tracking</Badge>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight gsap-hero-title">Track & Reduce Your <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">Carbon Footprint</span></h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto gsap-hero-desc">The intelligent platform for individuals, companies, and cities to measure and reduce environmental impact.</p>
            <div className="flex justify-center pt-4 gsap-hero-cta">
              {session?.user ? (
                <Link href="/dashboard"><Button size="lg" className="text-lg h-14 px-8 bg-green-600 hover:bg-green-700">Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" /></Button></Link>
              ) : (
                <Button size="lg" className="text-lg h-14 px-8 bg-green-600 hover:bg-green-700" onClick={() => setRegisterOpen(true)}>Get Started Free <ArrowRight className="ml-2 h-5 w-5" /></Button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-2 border-t">
              {(STATS_DATA || []).map((stat, index) => (
                <div key={index} className="space-y-2 group gsap-hero-stat">
                  <div className="flex items-center justify-center gap-2 text-green-600">{stat.icon}</div>
                  <p className="text-3xl font-bold text-green-600">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pt-2 pb-12 container mx-auto px-4">
        <div className="text-center mb-12 space-y-4">
          <Badge className="mb-2" variant="outline"><Sparkles className="h-3 w-3 mr-1" />All 12 Features</Badge>
          <h2 className="text-4xl font-bold">Powerful Features for Climate Action</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 gsap-features-grid">
          {(FEATURES_DATA || []).map((feature, index) => (
            <Card key={index} className="gsap-feature-card border-2 relative overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center ${feature.color}`}>{feature.icon}</div>
                  <Badge variant="secondary" className="text-xs">{feature.badge}</Badge>
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent><CardDescription className="text-base">{feature.description}</CardDescription></CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">How CarbonTrack Works</h2>
          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto gsap-steps-grid">
            {(HOW_IT_WORKS_DATA || []).map((item, index) => (
              <div key={index} className="gsap-step-card text-center space-y-4">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${item.color} text-white flex items-center justify-center text-2xl font-bold mx-auto shadow-lg`}>{item.step}</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">{item.icon}<h3 className="font-semibold text-lg">{item.title}</h3></div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 container mx-auto px-4 gsap-benefits-section">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <div className="space-y-6">
            <Badge variant="secondary"><Target className="h-3 w-3 mr-1" />Complete Solution</Badge>
            <h2 className="text-4xl font-bold">Everything You Need in One Platform</h2>
            <div className="space-y-3 pt-4">
              {(BENEFITS_DATA || []).map((benefit, index) => (
                <div key={index} className="flex items-center gap-3"><Check className="h-4 w-4 text-green-600" /><span className="text-base">{benefit}</span></div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Card className="gsap-benefit-card border-2 shadow-xl">
              <CardHeader><div className="flex items-center gap-3"><Leaf className="h-6 w-6 text-green-600" /><div><CardTitle>Your Impact</CardTitle><CardDescription>This Month</CardDescription></div></div></CardHeader>
              <CardContent><div className="space-y-4"><div><div className="flex justify-between mb-2"><span className="text-sm font-medium">Carbon Reduction</span><span className="text-sm font-bold text-green-600">-25%</span></div><div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-green-500 w-[75%]" /></div></div></div></CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-12 bg-gradient-to-br from-green-600 to-teal-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {(CTA_FLOATS || []).map((item, i) => (
            <div key={i} className="absolute rounded-full bg-white gsap-cta-particle" style={{ width: item.width, height: item.height, left: item.left, top: item.top }} />
          ))}
        </div>
        <div className="container mx-auto px-4 text-center space-y-8 relative z-10">
          <h2 className="text-4xl font-bold">Ready to Make a Difference?</h2>
          <div className="flex justify-center pt-4">
            {session?.user ? (
              <Link href="/dashboard"><Button size="lg" variant="secondary">Go to Dashboard <Zap className="ml-2 h-5 w-5" /></Button></Link>
            ) : (
              <Button size="lg" variant="secondary" onClick={() => setRegisterOpen(true)}>Start Tracking Now <Zap className="ml-2 h-5 w-5" /></Button>
            )}
          </div>
        </div>
      </section>

      <footer className="py-8 border-t bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">© 2026 CarbonTrack. Making the world more sustainable, one action at a time.</p>
        </div>
      </footer>

      <div className="fixed inset-0 pointer-events-none overflow-hidden z-[60]">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="gsap-falling-leaf absolute opacity-20" style={{ left: `${(i * 10) + 5}%`, top: `-10%` }}><Leaf className="h-6 w-6 text-green-500" /></div>
        ))}
      </div>
    </div>
  )
}
