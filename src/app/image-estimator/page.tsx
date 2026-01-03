"use client"

import { useMemo, useState, type ChangeEvent } from "react"
import Image from "next/image"
import { Upload, Sparkles, Leaf, AlertCircle, Info, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useSession } from "@/lib/auth-client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface AggregatedResult {
  [key: string]: {
    count: number
    emission_grams: number
  }
}

interface AnalysisResponse {
  detected: string[]
  aggregated: AggregatedResult
  estimated_co2_grams: number
  note: string
}

const formatNumber = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)

const buildSuggestions = (aggregated: AggregatedResult) => {
  const suggestions: string[] = []
  const keys = Object.keys(aggregated)

  if (keys.some((k) => ["car", "truck", "bus", "motorcycle"].includes(k))) {
    suggestions.push("Consider public transport, biking, or carpooling to cut transport emissions.")
  }
  if (keys.includes("air conditioner")) {
    suggestions.push("Set AC 1-2°C higher, clean filters, and use fans when possible.")
  }
  if (keys.includes("factory")) {
    suggestions.push("Review equipment efficiency and schedule maintenance to reduce industrial emissions.")
  }
  if (keys.includes("laptop")) {
    suggestions.push("Enable power-saving modes and unplug chargers when not in use.")
  }
  if (keys.includes("plastic bottle")) {
    suggestions.push("Swap single-use bottles for reusables to avoid plastic emissions.")
  }

  if (suggestions.length === 0) {
    suggestions.push("Look for low-carbon alternatives and reuse or recycle where possible.")
  }

  return suggestions
}

export default function ImageEstimatorPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResponse | null>(null)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0]
    if (!selected) return
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
    setError(null)
    setResult(null)
  }

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please upload an image first.")
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append("image", file)

      const response = await fetch("/api/image-emission", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const message = await response.json().catch(() => ({ error: "Unable to analyze image" }))
        throw new Error(message.error || "Unable to analyze image")
      }

      const data = await response.json()
      
      const aggregatedResult: AggregatedResult = {}
      if (data.detection && data.emission) {
        const key = data.detection.label.toLowerCase()
        aggregatedResult[key] = {
          count: 1,
          emission_grams: Math.round(data.emission.co2_kg * 1000)
        }
      }

      setResult({
        detected: [data.detection?.label || "unknown"],
        aggregated: aggregatedResult,
        estimated_co2_grams: Math.round(data.emission?.co2_kg * 1000) || 0,
        note: "This system uses AI image classification to detect objects and estimates carbon emissions using predefined emission factors. The results are approximate and intended for awareness and educational purposes only.",
      })
    } catch (err: any) {
      setError(err?.message || "Something went wrong while analyzing the image.")
    } finally {
      setIsLoading(false)
    }
  }

  const suggestions = useMemo(() => (result ? buildSuggestions(result.aggregated || {}) : []), [result])

  const handleSaveEmission = async () => {
    if (!session?.user?.id) {
      toast.error("Please sign in to save emissions")
      router.push("/")
      return
    }

    if (!result || result.estimated_co2_grams === 0) {
      toast.error("No emissions to save")
      return
    }

    setIsSaving(true)
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
          type: "image_detection",
          category: "product_lca",
          value: 1,
          unit: "detection",
          co2: result.estimated_co2_grams,
          subcategory: Object.keys(result.aggregated || {}).join(", "),
        }),
      })

      if (response.ok) {
        toast.success("Emission saved to dashboard!")
        setResult(null)
        setFile(null)
        setPreview(null)
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to save emission")
      }
    } catch (error) {
      console.error("Failed to save emission:", error)
      toast.error("Failed to save emission")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-3 text-center">
            <Badge variant="secondary" className="gap-2 justify-center">
              <Sparkles className="h-4 w-4" />
              AI-based Object Detection → Carbon Estimation
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">AI Image Detection</h1>
            <p className="text-lg text-muted-foreground">
              Upload a photo of any object - our AI will detect it and estimate its carbon footprint automatically.
            </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Upload Image</CardTitle>
              <CardDescription>Supports jpg, png, or webp. The file is sent to the local AI service for detection.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer hover:border-primary transition"
              >
                {preview ? (
                  <div className="w-full space-y-3">
                    <div className="relative w-full h-64 rounded-lg overflow-hidden bg-muted">
                      <Image src={preview} alt="Selected image" fill className="object-cover" />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">Click to replace image</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="p-3 rounded-full bg-muted">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">Drop an image or click to browse</p>
                      <p className="text-sm text-muted-foreground">JPG, PNG, or WEBP • Max 10MB</p>
                    </div>
                  </div>
                )}
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleAnalyze} disabled={isLoading || !file} className="flex-1">
                  {isLoading ? "Analyzing..." : "Analyze Image"}
                </Button>
                <Button variant="outline" onClick={() => { setFile(null); setPreview(null); setResult(null); setError(null) }}>
                  Reset
                </Button>
              </div>

                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Info className="h-4 w-4 mt-0.5" />
                  <span>Uses AI-powered image classification via Hugging Face to detect objects and estimate emissions.</span>
                </div>

              {error && (
                <div className="flex items-start gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle>Results</CardTitle>
                <CardDescription>Detected objects, mapped emissions, and AI-friendly suggestions.</CardDescription>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Leaf className="h-4 w-4" />
                Portfolio-safe
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {result ? (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-muted flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Estimated Emissions (approx)</p>
                      <p className="text-3xl font-bold">≈ {formatNumber(result.estimated_co2_grams)} g CO₂</p>
                    </div>
                    <Progress value={Math.min(100, (result.estimated_co2_grams / 3000) * 100)} className="w-32" />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Detected Objects</p>
                    {Object.keys(result.aggregated || {}).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No mapped objects detected. Try another image.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(result.aggregated).map(([key, value]) => (
                          <div key={key} className="p-3 rounded-lg border flex items-center justify-between">
                            <div>
                              <p className="font-medium capitalize">{key}</p>
                              <p className="text-xs text-muted-foreground">Count: {value.count}</p>
                            </div>
                            <p className="text-sm font-semibold">{formatNumber(value.emission_grams)} g</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Suggestions</p>
                    <ul className="space-y-2">
                      {suggestions.map((tip, idx) => (
                        <li key={idx} className="flex gap-2 text-sm">
                          <Sparkles className="h-4 w-4 mt-0.5 text-green-600" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                    <div className="text-xs text-muted-foreground border-t pt-3">
                      This system uses computer vision to detect objects from images and estimates carbon emissions using predefined emission factors. The results are approximate and intended for awareness and educational purposes only.
                    </div>

                    {session?.user && (
                      <Button 
                        onClick={handleSaveEmission} 
                        disabled={isSaving}
                        className="w-full gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {isSaving ? "Saving..." : "Save to Dashboard"}
                      </Button>
                    )}
                  </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Upload an image and click Analyze to see detected objects, estimated emissions, and reduction ideas.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
