import { NextResponse } from 'next/server';
import connectToDatabase from '@/db/mongodb';
import { ShopItem } from '@/db/models';

export async function GET() {
  try {
    await connectToDatabase();

    const existingItems = await ShopItem.countDocuments();
    if (existingItems > 0) {
      return NextResponse.json({ 
        message: 'Shop items already seeded',
        count: existingItems 
      });
    }

    const shopItems = [
      // Avatar Frames - Common
      {
        itemId: 'frame_green_basic',
        name: 'Eco Warrior Frame',
        description: 'A simple green frame showing your commitment to the environment',
        type: 'avatar_frame',
        price: 50,
        rarity: 'common',
        cssClass: 'border-4 border-green-500 rounded-full',
        metadata: { borderColor: '#22c55e', borderWidth: 4 },
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        itemId: 'frame_blue_basic',
        name: 'Ocean Guardian Frame',
        description: 'A calming blue frame representing the oceans you protect',
        type: 'avatar_frame',
        price: 50,
        rarity: 'common',
        cssClass: 'border-4 border-blue-500 rounded-full',
        metadata: { borderColor: '#3b82f6', borderWidth: 4 },
        isActive: true,
        createdAt: new Date().toISOString()
      },
      
      // Avatar Frames - Rare
      {
        itemId: 'frame_gold_gradient',
        name: 'Golden Achiever Frame',
        description: 'A prestigious golden gradient frame for top performers',
        type: 'avatar_frame',
        price: 150,
        rarity: 'rare',
        cssClass: 'border-4 border-transparent bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-full',
        metadata: { gradient: true, colors: ['#fbbf24', '#eab308', '#ca8a04'] },
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        itemId: 'frame_rainbow',
        name: 'Rainbow Protector Frame',
        description: 'A vibrant rainbow frame celebrating environmental diversity',
        type: 'avatar_frame',
        price: 200,
        rarity: 'rare',
        cssClass: 'border-4 border-transparent bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full',
        metadata: { gradient: true, animated: true },
        isActive: true,
        createdAt: new Date().toISOString()
      },

      // Avatar Frames - Epic
      {
        itemId: 'frame_diamond',
        name: 'Diamond Elite Frame',
        description: 'An exclusive crystalline frame for legendary carbon reducers',
        type: 'avatar_frame',
        price: 400,
        rarity: 'epic',
        cssClass: 'border-4 border-cyan-400 rounded-full shadow-lg shadow-cyan-400/50',
        metadata: { glow: true, glowColor: '#22d3ee' },
        isActive: true,
        createdAt: new Date().toISOString()
      },

      // Avatar Frames - Legendary
      {
        itemId: 'frame_legendary_earth',
        name: 'Planet Guardian Frame',
        description: 'The ultimate frame reserved for true environmental champions',
        type: 'avatar_frame',
        price: 1000,
        rarity: 'legendary',
        cssClass: 'border-4 border-transparent bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 rounded-full animate-pulse',
        metadata: { gradient: true, animated: true, legendary: true },
        isActive: true,
        createdAt: new Date().toISOString()
      },

      // Titles - Common
      {
        itemId: 'title_beginner',
        name: 'Carbon Tracker',
        description: 'Your first step in the journey to carbon neutrality',
        type: 'title',
        price: 30,
        rarity: 'common',
        metadata: { color: '#6b7280' },
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        itemId: 'title_eco_friendly',
        name: 'Eco-Friendly',
        description: 'Someone who makes sustainable choices daily',
        type: 'title',
        price: 40,
        rarity: 'common',
        metadata: { color: '#22c55e' },
        isActive: true,
        createdAt: new Date().toISOString()
      },

      // Titles - Rare
      {
        itemId: 'title_green_warrior',
        name: 'Green Warrior',
        description: 'Fighting climate change one action at a time',
        type: 'title',
        price: 120,
        rarity: 'rare',
        metadata: { color: '#16a34a', bold: true },
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        itemId: 'title_climate_champion',
        name: 'Climate Champion',
        description: 'A recognized leader in carbon reduction',
        type: 'title',
        price: 180,
        rarity: 'rare',
        metadata: { color: '#2563eb', bold: true },
        isActive: true,
        createdAt: new Date().toISOString()
      },

      // Titles - Epic
      {
        itemId: 'title_carbon_master',
        name: 'Carbon Master',
        description: 'Mastered the art of low-carbon living',
        type: 'title',
        price: 350,
        rarity: 'epic',
        metadata: { color: '#9333ea', bold: true, italic: true },
        isActive: true,
        createdAt: new Date().toISOString()
      },

      // Titles - Legendary
      {
        itemId: 'title_earth_savior',
        name: 'Earth Savior',
        description: 'A legendary title for those who inspire change globally',
        type: 'title',
        price: 800,
        rarity: 'legendary',
        metadata: { gradient: true, animated: true },
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ];

      await ShopItem.insertMany(shopItems);

    return NextResponse.json({
      message: 'Shop items seeded successfully',
      count: shopItems.length
    });
  } catch (error) {
    console.error('Error seeding shop items:', error);
    return NextResponse.json(
      { error: 'Failed to seed shop items' },
      { status: 500 }
    );
  }
}
