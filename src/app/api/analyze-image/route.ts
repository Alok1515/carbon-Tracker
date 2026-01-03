import { NextRequest, NextResponse } from "next/server"
import { emissionFactorsLowercase } from "@/lib/emission-factors"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000/detect"

function findEmissionMatch(label: string) {
  const lower = label.toLowerCase()
  for (const [key, value] of Object.entries(emissionFactorsLowercase)) {
    if (lower.includes(key) || key.includes(lower)) {
      return { key, grams: value }
    }
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const imageFile = (formData.get("file") || formData.get("image")) as File | null

    if (!imageFile) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    const arrayBuffer = await imageFile.arrayBuffer()
    const blob = new Blob([arrayBuffer], { type: imageFile.type || "image/jpeg" })

    const forwardForm = new FormData()
    forwardForm.append("file", blob, imageFile.name || "upload.jpg")

    const aiRes = await fetch(AI_SERVICE_URL, {
      method: "POST",
      body: forwardForm,
    })

    if (!aiRes.ok) {
      const errorText = await aiRes.text()
      console.error("AI service error:", errorText)
      return NextResponse.json(
        { error: "AI detection service unavailable", details: errorText },
        { status: 502 }
      )
    }

    const aiData = (await aiRes.json()) as { detected_objects?: string[] }
    const detected = aiData.detected_objects || []

    const matches: Array<{ label: string; matchedKey: string; emission_grams: number }> = []
    let totalCO2 = 0

    for (const label of detected) {
      const match = findEmissionMatch(label)
      if (match) {
        totalCO2 += match.grams
        matches.push({ label, matchedKey: match.key, emission_grams: match.grams })
      }
    }

    const aggregated = matches.reduce<Record<string, { count: number; emission_grams: number }>>((acc, item) => {
      const existing = acc[item.matchedKey] || { count: 0, emission_grams: 0 }
      existing.count += 1
      existing.emission_grams += item.emission_grams
      acc[item.matchedKey] = existing
      return acc
    }, {})

    return NextResponse.json({
      detected,
      matched: matches,
      aggregated,
      estimated_co2_grams: totalCO2,
      note: "This system uses computer vision to detect objects from images and estimates carbon emissions using predefined emission factors. The results are approximate and intended for awareness and educational purposes only.",
    })
  } catch (error: any) {
    console.error("Analyze image API error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    )
  }
}
