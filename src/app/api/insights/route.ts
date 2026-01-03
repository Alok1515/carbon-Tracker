import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/db/mongodb';
import { Emissions } from '@/db/models';

interface Insight {
  id: string;
  type: "success" | "warning" | "tip" | "goal";
  title: string;
  description: string;
  impact?: string;
  actionable?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    // Fetch all user emissions
    const emissions = await Emissions.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    if (emissions.length === 0) {
      return NextResponse.json([
        {
          id: "welcome",
          type: "tip",
          title: "Welcome to CarbonTrack!",
          description: "Start tracking your emissions to receive personalized insights. Add your first emission entry to see AI-powered recommendations.",
          actionable: true
        }
      ]);
    }

    const insights: Insight[] = [];
    
    // Calculate date ranges
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Separate emissions by time period
    const currentMonthEmissions = emissions.filter(e => new Date(e.createdAt) >= currentMonth);
    const lastMonthEmissions = emissions.filter(e => 
      new Date(e.createdAt) >= lastMonth && new Date(e.createdAt) < currentMonth
    );
    const lastWeekEmissions = emissions.filter(e => new Date(e.createdAt) >= lastWeek);

    // Calculate totals
    const currentMonthTotal = currentMonthEmissions.reduce((sum, e) => sum + e.co2, 0) / 1000;
    const lastMonthTotal = lastMonthEmissions.reduce((sum, e) => sum + e.co2, 0) / 1000;
    const totalEmissions = emissions.reduce((sum, e) => sum + e.co2, 0) / 1000;

    // 1. Month-over-month trend analysis
    if (lastMonthTotal > 0) {
      const monthlyChange = ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
      
      if (monthlyChange < -10) {
        insights.push({
          id: "monthly-success",
          type: "success",
          title: "Excellent Monthly Progress!",
          description: `You've reduced your carbon emissions by ${Math.abs(monthlyChange).toFixed(1)}% this month compared to last month. Keep up the outstanding work!`,
          impact: `Saved ${Math.abs(currentMonthTotal - lastMonthTotal).toFixed(1)}kg CO2`,
          actionable: false
        });
      } else if (monthlyChange > 20) {
        insights.push({
          id: "monthly-warning",
          type: "warning",
          title: "Significant Increase Detected",
          description: `Your emissions increased by ${monthlyChange.toFixed(1)}% this month. Review your recent activities to identify areas for improvement.`,
          impact: `Extra ${(currentMonthTotal - lastMonthTotal).toFixed(1)}kg CO2`,
          actionable: true
        });
      } else if (monthlyChange < 0) {
        insights.push({
          id: "monthly-improvement",
          type: "success",
          title: "You're Making Progress!",
          description: `Your emissions decreased by ${Math.abs(monthlyChange).toFixed(1)}% this month. Small improvements add up to big impact!`,
          impact: `Saved ${Math.abs(currentMonthTotal - lastMonthTotal).toFixed(1)}kg CO2`,
          actionable: false
        });
      }
    }

    // 2. Category analysis - find top emitters
    const categoryTotals: { [key: string]: number } = {};
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

    currentMonthEmissions.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.co2 / 1000;
    });

    const sortedCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (sortedCategories.length > 0) {
      const [topCategory, topValue] = sortedCategories[0];
      const percentage = ((topValue / currentMonthTotal) * 100).toFixed(0);
      
      insights.push({
        id: "top-category",
        type: "warning",
        title: `${categoryNames[topCategory] || topCategory} is Your Top Emitter`,
        description: `${categoryNames[topCategory] || topCategory} accounts for ${percentage}% of your emissions this month (${topValue.toFixed(1)}kg CO2). Focus on reducing this category for maximum impact.`,
        impact: `${topValue.toFixed(1)}kg CO2 this month`,
        actionable: true
      });
    }

    // 3. Weekly spike detection
    if (lastWeekEmissions.length > 0) {
      const lastWeekTotal = lastWeekEmissions.reduce((sum, e) => sum + e.co2, 0) / 1000;
      const weeklyAverage = currentMonthTotal / 4; // Rough weekly average
      
      if (lastWeekTotal > weeklyAverage * 1.5) {
        insights.push({
          id: "weekly-spike",
          type: "warning",
          title: "Unusual Activity This Week",
          description: `Your emissions spiked ${((lastWeekTotal / weeklyAverage - 1) * 100).toFixed(0)}% above your weekly average. Check recent activities that might have contributed to this increase.`,
          impact: `Extra ${(lastWeekTotal - weeklyAverage).toFixed(1)}kg CO2`,
          actionable: true
        });
      }
    }

    // 4. Category-specific tips based on actual data
    const transportationTotal = categoryTotals['transportation'] || 0;
    const electricityTotal = categoryTotals['electricity'] || 0;
    const heatingTotal = categoryTotals['heating'] || 0;

    if (transportationTotal > 50) {
      insights.push({
        id: "transport-tip",
        type: "tip",
        title: "Transportation Optimization",
        description: "Consider carpooling, public transit, or cycling for short trips. Even reducing car usage by 20% could make a significant impact.",
        impact: `Potential -${(transportationTotal * 0.2).toFixed(1)}kg CO2/month`,
        actionable: true
      });
    }

    if (electricityTotal > 40) {
      insights.push({
        id: "electricity-tip",
        type: "tip",
        title: "Energy Efficiency Opportunity",
        description: "Switch to LED bulbs and unplug devices when not in use. Small changes in electricity usage can reduce 15-20% of energy emissions.",
        impact: `Potential -${(electricityTotal * 0.175).toFixed(1)}kg CO2/month`,
        actionable: true
      });
    }

    if (heatingTotal > 30) {
      insights.push({
        id: "heating-tip",
        type: "tip",
        title: "Heating Efficiency",
        description: "Lowering your thermostat by 1°C can reduce heating emissions by 8%. Consider programmable thermostats for optimal efficiency.",
        impact: `Potential -${(heatingTotal * 0.08).toFixed(1)}kg CO2/month`,
        actionable: true
      });
    }

    // 5. Goal progress (carbon neutrality)
    const treesNeeded = Math.ceil(totalEmissions / 21); // 21kg CO2 per tree per year
    const goalEmissions = 100; // Target: under 100kg
    
    if (currentMonthTotal < goalEmissions) {
      insights.push({
        id: "goal-success",
        type: "success",
        title: "Carbon Target Achieved!",
        description: `You're under the recommended ${goalEmissions}kg CO2/month target. You're setting an excellent example for sustainable living!`,
        actionable: false
      });
    } else {
      const remaining = ((currentMonthTotal - goalEmissions) / currentMonthTotal * 100).toFixed(0);
      insights.push({
        id: "goal-progress",
        type: "goal",
        title: "Working Towards Carbon Target",
        description: `You're ${remaining}% above the ${goalEmissions}kg target. Plant ${treesNeeded} trees or reduce emissions by ${(currentMonthTotal - goalEmissions).toFixed(1)}kg to reach carbon neutrality.`,
        impact: `${(currentMonthTotal - goalEmissions).toFixed(1)}kg to target`,
        actionable: true
      });
    }

    // 6. Seasonal recommendations
    const month = now.getMonth();
    if (month >= 10 || month <= 2) { // Winter months
      insights.push({
        id: "seasonal-winter",
        type: "tip",
        title: "Winter Energy Savings",
        description: "Install weather stripping on doors and windows to reduce heating needs. This simple upgrade can cut heating emissions by 15-25%.",
        impact: `Potential -${(heatingTotal * 0.2).toFixed(1)}kg CO2/month`,
        actionable: true
      });
    } else if (month >= 5 && month <= 8) { // Summer months
      insights.push({
        id: "seasonal-summer",
        type: "tip",
        title: "Summer Cooling Tips",
        description: "Use fans instead of AC when possible and keep blinds closed during peak sun hours. Can reduce cooling emissions by 20-30%.",
        impact: `Potential -${(electricityTotal * 0.25).toFixed(1)}kg CO2/month`,
        actionable: true
      });
    }

    // 7. Consistency tracking
    const emissionDays = new Set(emissions.map(e => new Date(e.createdAt).toDateString())).size;
    const daysSinceStart = Math.ceil((now.getTime() - new Date(emissions[emissions.length - 1].createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const trackingConsistency = (emissionDays / daysSinceStart) * 100;

    if (trackingConsistency > 70) {
      insights.push({
        id: "consistency-good",
        type: "success",
        title: "Excellent Tracking Consistency!",
        description: `You've logged emissions on ${emissionDays} days. Consistent tracking leads to better awareness and carbon reduction.`,
        actionable: false
      });
    }

    // Limit to top 6 most relevant insights
    return NextResponse.json(insights.slice(0, 6));

  } catch (error) {
    console.error('Insights API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
