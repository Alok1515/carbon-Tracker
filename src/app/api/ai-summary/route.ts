import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/db/mongodb";
import { Emissions } from "@/db/models";

export async function POST(request: NextRequest) {
  try {
    const { userId, totalEmissions, monthlyChange, topCategory } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "OpenRouter API key not configured" }, { status: 500 });
    }

    const model = process.env.OPENROUTER_MODEL || "kwaipilot/kat-coder-pro:free";

    const categoryNames: { [key: string]: string } = {
      transportation: "Transportation",
      electricity: "Electricity",
      heating: "Heating",
      flights: "Flights",
      food: "Food",
      manufacturing: "Manufacturing",
      energy: "Energy",
      waste: "Waste",
      product_lca: "Product Lifecycle",
      plastic_waste: "Plastic Waste",
      paper_waste: "Paper Waste",
      metal_waste: "Metal Waste",
      glass_waste: "Glass Waste",
      electronics: "Electronics",
      furniture: "Furniture",
      clothing: "Clothing",
      general_waste: "General Waste"
    };

    const humanReadableCategory = categoryNames[topCategory] || topCategory || "N/A";

    // Build context
    const context = `
USER DATA:
- Total Carbon Footprint (this month): ${totalEmissions.toFixed(2)} kg CO2
- Monthly Change: ${monthlyChange > 0 ? "+" : ""}${monthlyChange.toFixed(2)}%
- Top Emitter Category: ${humanReadableCategory}

TASK:
Generate a concise (max 3 sentences), encouraging, and data-driven summary of the user's carbon footprint.
If emissions decreased, celebrate the progress. If they increased, give a gentle tip.
Use exactly one emoji at the start.
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: "You are an AI Sustainability Expert. Provide short, punchy, and personalized carbon footprint summaries." },
          { role: "user", content: context }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("OpenRouter API error");
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || "Your carbon footprint is being analyzed. Keep tracking to see improvements!";

    return NextResponse.json({ summary });

  } catch (error) {
    console.error("AI Summary Error:", error);
    return NextResponse.json({ error: "Failed to generate AI summary" }, { status: 500 });
  }
}
