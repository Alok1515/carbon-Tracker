import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

// Use Hugging Face Serverless Inference API with DETR model
const HF_API_URL = "https://api-inference.huggingface.co/models/facebook/detr-resnet-50"
const HF_TOKEN = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN

interface HuggingFaceDetection {
  label: string
  score: number
  box?: {
    xmin: number
    ymin: number
    xmax: number
    ymax: number
  }
}

const EMISSION_FACTORS: Record<string, number> = {
  car: 120,
  truck: 900,
  bus: 1000,
  motorcycle: 90,
  laptop: 50,
  refrigerator: 1200,
  person: 0,
  bicycle: 0,
  airplane: 2500,
  train: 150,
  boat: 400,
  bottle: 5,
  cup: 3,
  chair: 20,
  couch: 150,
  dining_table: 100,
  tv: 80,
  keyboard: 15,
  cell_phone: 40,
  microwave: 200,
  oven: 500,
  toaster: 50,
  sink: 100,
  book: 2,
  clock: 10,
  vase: 8,
  scissors: 5,
  teddy_bear: 15,
  hair_drier: 35,
  toothbrush: 2,
}

function normalizeLabel(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]/g, "_")
}

function getEmissionFactor(label: string): number {
  const normalized = normalizeLabel(label)
  
  for (const [key, value] of Object.entries(EMISSION_FACTORS)) {
    const normalizedKey = normalizeLabel(key)
    if (normalized.includes(normalizedKey) || normalizedKey.includes(normalized)) {
      return value
    }
  }
  
  return 50
}

export async function POST(req: NextRequest) {
  try {
    if (!HF_TOKEN) {
      return NextResponse.json(
        { error: "Hugging Face API token not configured" },
        { status: 500 }
      )
    }

    const formData = await req.formData()
    const imageFile = (formData.get("file") || formData.get("image")) as File | null

    if (!imageFile) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    const arrayBuffer = await imageFile.arrayBuffer()
    
      // Try Hugging Face API with wait_for_model parameter
      const response = await fetch(`${HF_API_URL}?wait_for_model=true`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
        },
        body: arrayBuffer,
      })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Hugging Face API error:", errorText)
      
      if (response.status === 503) {
        return NextResponse.json(
          { 
            error: "Model is loading. Please try again in a few moments.",
            retry_after: 20 
          },
          { status: 503 }
        )
      }
      
      return NextResponse.json(
        { error: "Failed to analyze image", details: errorText },
        { status: response.status }
      )
    }

    const detections = (await response.json()) as HuggingFaceDetection[]
    
    const filteredDetections = detections.filter((d) => d.score >= 0.7)
    
    const objectCounts: Record<string, number> = {}
    filteredDetections.forEach((detection) => {
      const label = detection.label
      objectCounts[label] = (objectCounts[label] || 0) + 1
    })

    let totalCO2 = 0
    const detectedObjects: Array<{ label: string; count: number; co2_per_item: number; total_co2: number }> = []

    for (const [label, count] of Object.entries(objectCounts)) {
      const co2PerItem = getEmissionFactor(label)
      const totalForLabel = co2PerItem * count
      totalCO2 += totalForLabel
      
      detectedObjects.push({
        label,
        count,
        co2_per_item: co2PerItem,
        total_co2: totalForLabel,
      })
    }

    return NextResponse.json({
      detected_objects: detectedObjects,
      estimated_co2_grams: totalCO2,
      disclaimer: "This is an approximate estimation based on visual object detection and standard emission factors.",
    })
  } catch (error: any) {
    console.error("Object detection API error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    )
  }
}
