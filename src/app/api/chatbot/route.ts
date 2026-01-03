import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/db/mongodb";
import { Emissions } from "@/db/models";

export async function POST(request: NextRequest) {
  try {
    const { message, userId } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured" },
        { status: 500 }
      );
    }

    const model = process.env.OPENROUTER_MODEL || "kwaipilot/kat-coder-pro:free";

    // Fetch user emission data if userId provided
    let userContext = "";
    if (userId) {
      try {
        await connectToDatabase();
        
        // Get user's emissions
        const emissions = await Emissions.find({ userId })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();

        if (emissions.length > 0) {
          // Calculate statistics
          const totalEmissions = emissions.reduce((sum, e) => sum + e.co2, 0) / 1000; // kg
          const categories = emissions.reduce((acc: any, e) => {
            acc[e.category] = (acc[e.category] || 0) + e.co2 / 1000;
            return acc;
          }, {});
          
          const topCategory = Object.entries(categories).sort((a: any, b: any) => b[1] - a[1])[0];
          
          // Get recent emissions (last 7 days)
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          const recentEmissions = emissions.filter(e => new Date(e.createdAt) >= sevenDaysAgo);
          const recentTotal = recentEmissions.reduce((sum, e) => sum + e.co2, 0) / 1000;

          userContext = `

USER EMISSION DATA:
- Total carbon footprint: ${totalEmissions.toFixed(2)} kg CO2
- Top emission category: ${topCategory?.[0] || "N/A"} (${topCategory?.[1]?.toFixed(2) || 0} kg CO2)
- Last 7 days emissions: ${recentTotal.toFixed(2)} kg CO2
- Number of logged activities: ${emissions.length}
- Recent categories: ${recentEmissions.map(e => e.category).slice(0, 5).join(", ")}

Use this data to provide personalized, data-driven advice specific to the user's carbon footprint.`;
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        // Continue without user data
      }
    }

    // Build eco-friendly assistant prompt with user data
    const systemPrompt = `You are the expert Carbon Assistant for CarbonTrack. Your goal is to help users understand and reduce their carbon footprint through friendly, data-driven, and actionable advice.${userContext}

When responding, follow these formatting guidelines:
1. USE **BOLD TEXT** for key metrics, important terms, and actionable steps.
2. USE BULLET POINTS (- ) for lists of tips or multiple suggestions.
3. USE NUMBERED LISTS (1. ) for step-by-step instructions.
4. KEEP PARAGRAPHS SHORT (2-3 sentences max) for better readability.
5. USE EMOJIS at the start of sections for visual cues:
   - 💡 for insights or tips
   - 📊 for data-related points
   - ♻️ for sustainable actions
   - ✅ for positive reinforcement
   - ⚠️ for warnings or areas needing attention

TONE:
- Supportive and encouraging (celebrate progress!).
- Informative and expert (use the provided emission data).
- Action-oriented (give specific, practical advice).
- Support specific account types (individual/company/city) if mentioned in context.

Avoid long blocks of unformatted text. Break things down with lists and bolding to make them easy to scan.`;

    // Call OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "OpenRouter API error");
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "No response from AI";

    return NextResponse.json({ 
      reply,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("🔥 OpenRouter Error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isQuotaError = errorMessage.includes("429") || errorMessage.includes("quota");
    
    return NextResponse.json(
      { 
        error: isQuotaError 
          ? "API quota exceeded. Please wait a moment and try again."
          : "Unable to process your request. Please try again.",
        details: errorMessage,
        isQuotaError
      },
      { status: isQuotaError ? 429 : 500 }
    );
  }
}