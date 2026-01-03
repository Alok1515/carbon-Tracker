import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/db/mongodb';
import { UserBadge, Badge, Emissions, TreePlantings, UserStats, UserProfile, SocialPost } from '@/db/models';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    // Validate userId
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Valid userId is required',
          code: 'MISSING_USER_ID' 
        },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectToDatabase();

    // Define points reward per badge
    const BADGE_POINTS = 500;

    // Define badge calculation functions
    const badgeCalculations = {
      'first-step': async () => {
        const count = await Emissions.countDocuments({ userId });
        return count > 0 ? 100 : 0;
      },

      'eco-warrior': async () => {
        const userStats = await UserStats.findOne({ userId }).lean();
        if (!userStats || !userStats.hasLoggedEmissions) return 0;

        // Compare monthly emissions with total prior emissions (average)
        const currentMonthly = userStats.monthlyEmissions || 0;
        const previousTotal = userStats.totalEmissions - currentMonthly;
        
        if (previousTotal <= 0) {
          // If no previous data, compare with standard baseline (15kg/day * 30 days = 450kg)
          const baseline = 450 * 1000; // in grams
          const reduction = baseline - currentMonthly;
          const progress = Math.min((reduction / (baseline * 0.5)) * 100, 100);
          return Math.max(0, Math.round(progress));
        }

        const reduction = previousTotal - currentMonthly;
        // Progress toward 50% reduction
        const progress = Math.min((reduction / (previousTotal * 0.5)) * 100, 100);
        return Math.max(0, Math.round(progress));
      },

      'carbon-neutral': async () => {
        const treePlantings = await TreePlantings.find({ userId }).lean();
        const totalTrees = treePlantings.reduce((sum, planting) => sum + (planting.treesPlanted || 0), 0);
        
        // Each tree offsets approximately 22 kg of CO2 per year
        const co2OffsetGrams = totalTrees * 22 * 1000;

        const userStats = await UserStats.findOne({ userId }).lean();
        const totalEmissionsGrams = userStats?.totalEmissions || 0;

        if (totalEmissionsGrams === 0) return 0;
        const progress = Math.min((co2OffsetGrams / totalEmissionsGrams) * 100, 100);
        return Math.round(progress);
      },

      'green-commuter': async () => {
        const transportationEmissions = await Emissions.find({ 
          userId, 
          category: 'transportation' 
        }).lean();
        
        const uniqueDates = new Set(
          transportationEmissions.map(e => {
            const date = e.createdAt;
            return date ? new Date(date).toISOString().split('T')[0] : null;
          }).filter(Boolean)
        );

        const daysCount = uniqueDates.size;
        const progress = Math.min((daysCount / 30) * 100, 100);
        return Math.round(progress);
      },

      'energy-saver': async () => {
        const energyEmissions = await Emissions.find({ 
          userId,
          category: { $in: ['electricity', 'heating'] }
        }).sort({ createdAt: 1 }).lean();

        if (energyEmissions.length < 2) return 0;

        // Calculate reduction: compare first half vs second half
        const midpoint = Math.floor(energyEmissions.length / 2);
        const firstHalf = energyEmissions.slice(0, midpoint);
        const secondHalf = energyEmissions.slice(midpoint);

        const firstHalfTotal = firstHalf.reduce((sum, e) => sum + (e.co2 || 0), 0);
        const secondHalfTotal = secondHalf.reduce((sum, e) => sum + (e.co2 || 0), 0);

        if (firstHalfTotal === 0) return 0;

        const reductionPercent = ((firstHalfTotal - secondHalfTotal) / firstHalfTotal) * 100;
        const progress = Math.min((reductionPercent / 25) * 100, 100);
        return Math.max(0, Math.round(progress));
      },

      'home-hero': async () => {
        // Count emissions in buildings, electricity, street_lighting, or water_treatment
        const homeActions = await Emissions.countDocuments({ 
          userId,
          category: { $in: ['buildings', 'electricity', 'heating'] }
        });
        
        const progress = Math.min((homeActions / 5) * 100, 100);
        return Math.round(progress);
      },

      'sustainability-champion': async () => {
        const allEmissions = await Emissions.find({ userId }).lean();
        
        const uniqueDates = new Set(
          allEmissions.map(e => {
            const date = e.createdAt;
            return date ? new Date(date).toISOString().split('T')[0] : null;
          }).filter(Boolean)
        );

        const daysCount = uniqueDates.size;
        const progress = Math.min((daysCount / 100) * 100, 100);
        return Math.round(progress);
      },

      'tree-planter': async () => {
        const treePlantings = await TreePlantings.find({ userId }).lean();
        const totalTrees = treePlantings.reduce((sum, planting) => sum + (planting.treesPlanted || 0), 0);
        
        const progress = Math.min((totalTrees / 10) * 100, 100);
        return Math.round(progress);
      }
    };

    // Get all badge definitions
    const allBadges = await Badge.find().lean();

    if (allBadges.length === 0) {
      return NextResponse.json(
        { 
          error: 'No badges found in system',
          code: 'NO_BADGES' 
        },
        { status: 404 }
      );
    }

    const updatedBadges = [];

    // Process each badge
    for (const badge of allBadges) {
      const calculationFn = badgeCalculations[badge.badgeId as keyof typeof badgeCalculations];
      
      if (!calculationFn) {
        console.warn(`No calculation function for badge: ${badge.badgeId}`);
        continue;
      }

      try {
        const progress = await calculationFn();
        const earned = progress >= 100;
        const currentTime = new Date().toISOString();

        // Check if user badge record exists
        const existingUserBadge = await UserBadge.findOne({ userId, badgeId: badge.badgeId }).lean();
        let justEarned = false;

        if (existingUserBadge) {
          // Update existing badge
          const wasEarned = existingUserBadge.earned;
          justEarned = earned && !wasEarned;
          const earnedAt = justEarned ? currentTime : existingUserBadge.earnedAt;

          const updated = await UserBadge.findOneAndUpdate(
            { userId, badgeId: badge.badgeId },
            {
              progress,
              earned,
              earnedAt,
              updatedAt: currentTime
            },
            { new: true }
          ).lean();

          updatedBadges.push({ ...updated, justEarned, name: badge.name });
        } else {
          // Create new badge record
          justEarned = earned;
          const newBadge = await UserBadge.create({
            userId,
            badgeId: badge.badgeId,
            progress,
            earned,
            earnedAt: earned ? currentTime : null,
            createdAt: currentTime,
            updatedAt: currentTime
          });

          updatedBadges.push({ ...newBadge.toObject(), justEarned, name: badge.name });
        }

        // If just earned, award points and create social post
        if (justEarned) {
          // Award points
          await UserProfile.findOneAndUpdate(
            { userId },
            { $inc: { totalPointsEarned: BADGE_POINTS } },
            { upsert: true }
          );

          // Create social post
          await SocialPost.create({
            postId: crypto.randomUUID(),
            userId,
            type: 'achievement',
            content: `I just earned the ${badge.name} badge for: ${badge.description}! 🏅`,
            metadata: {
              badgeId: badge.badgeId,
              badgeName: badge.name,
              badgeIcon: badge.icon
            },
            createdAt: currentTime,
            likes: [],
            comments: []
          });
        }

      } catch (badgeError) {
        console.error(`Error calculating badge ${badge.badgeId}:`, badgeError);
        continue;
      }
    }

    return NextResponse.json(updatedBadges, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}