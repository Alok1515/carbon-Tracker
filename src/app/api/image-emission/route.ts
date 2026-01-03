import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface DetectionResult {
  label: string
  score: number
  box: {
    xmin: number
    ymin: number
    xmax: number
    ymax: number
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const image = (formData.get("image") || formData.get("file")) as File | null

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      )
    }

    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN
    
    if (!HF_API_KEY) {
      return NextResponse.json(
        { error: "Hugging Face API key not configured" },
        { status: 500 }
      )
    }

    const response = await fetch(
      "https://api-inference.huggingface.co/models/facebook/detr-resnet-50",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/octet-stream",
        },
        body: buffer,
      }
    )

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      console.error("Hugging Face API error:", errorText)

      if (response.status === 503) {
        return NextResponse.json(
          { error: "Model is loading, please wait 20-30 seconds and retry." },
          { status: 503 }
        )
      }

      if (response.status === 404) {
        return NextResponse.json(
          { error: "Model not found. Ensure facebook/detr-resnet-50 is accessible." },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { 
          error: `API Error (${response.status})`, 
          details: errorText?.slice(0, 500),
          hint: "Check API key permissions or try again later"
        },
        { status: response.status }
      )
    }

    const detections = (await response.json()) as DetectionResult[]

    // Filter detections with score >= 0.7
    const filteredDetections = detections.filter((d) => d.score >= 0.7)

    // Carbon emission mapping (grams CO₂, approximate)
    const emissionMapping: { [key: string]: number } = {
      car: 120,
      truck: 900,
      bus: 1000,
      motorcycle: 90,
      laptop: 50,
      refrigerator: 1200,
      person: 0,
    }

    // Count detected objects and calculate emissions
    const detectedObjects: { [key: string]: number } = {}
    let totalCO2Grams = 0

    filteredDetections.forEach((detection) => {
      const label = detection.label.toLowerCase()
      
      // Count objects
      detectedObjects[label] = (detectedObjects[label] || 0) + 1
      
      // Add emission if mapped
      if (emissionMapping[label] !== undefined) {
        totalCO2Grams += emissionMapping[label]
      }
    })

    // Format detected objects array with counts
    const detectedObjectsArray = Object.entries(detectedObjects).map(([label, count]) => 
      count > 1 ? `${label} (${count})` : label
    )

    const co2Kg = totalCO2Grams / 1000
    const primaryLabel = detectedObjectsArray[0] || "Unknown object"

    return NextResponse.json({
      detected_objects: detectedObjectsArray,
      estimated_co2_grams: totalCO2Grams,
      disclaimer: "This is an approximate estimation based on visual object detection and standard emission factors.",
      
      // Legacy format for compatibility with existing UI
      detection: {
        label: primaryLabel,
        confidence: filteredDetections[0]?.score || 0,
      },
      emission: {
        co2_kg: co2Kg,
        category: "product_lca",
      },
      category: "product_lca",
      value: filteredDetections.length,
      unit: "objects",
      co2: totalCO2Grams,
      confidence: filteredDetections[0]?.score || 0,
      description: `Detected ${detectedObjectsArray.length} object(s) with ~${co2Kg.toFixed(2)} kg CO₂e emissions.`,
      allPredictions: filteredDetections.slice(0, 5).map(d => ({ label: d.label, score: d.score })),
    })

  } catch (error: any) {
    console.error("Image emission API error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    )
  }
}
