import connectToDatabase from '../mongodb';
import { Badge } from '../models';

const badgesData = [
  {
    badgeId: 'first-step',
    name: 'First Step',
    description: 'Log your first emission',
    icon: 'Leaf',
    requirement: 'Log 1 emission',
    category: 'Getting Started',
    createdAt: new Date().toISOString(),
  },
  {
    badgeId: 'eco-warrior',
    name: 'Eco Warrior',
    description: 'Reduce emissions by 50%',
    icon: 'Target',
    requirement: 'Achieve 50% reduction',
    category: 'Reduction',
    createdAt: new Date().toISOString(),
  },
  {
    badgeId: 'carbon-neutral',
    name: 'Carbon Neutral',
    description: 'Offset 100% of your emissions with trees',
    icon: 'Award',
    requirement: 'Plant enough trees to offset all emissions',
    category: 'Offset',
    createdAt: new Date().toISOString(),
  },
  {
    badgeId: 'green-commuter',
    name: 'Green Commuter',
    description: 'Track transportation for 30 days',
    icon: 'Bike',
    requirement: 'Log transportation emissions for 30 days',
    category: 'Consistency',
    createdAt: new Date().toISOString(),
  },
  {
    badgeId: 'energy-saver',
    name: 'Energy Saver',
    description: 'Reduce energy consumption by 25%',
    icon: 'Zap',
    requirement: 'Achieve 25% energy reduction',
    category: 'Reduction',
    createdAt: new Date().toISOString(),
  },
  {
    badgeId: 'home-hero',
    name: 'Home Hero',
    description: 'Complete 5 home improvements',
    icon: 'Home',
    requirement: 'Complete 5 eco-friendly home improvements',
    category: 'Action',
    createdAt: new Date().toISOString(),
  },
  {
    badgeId: 'sustainability-champion',
    name: 'Sustainability Champion',
    description: 'Track emissions for 100 days',
    icon: 'Calendar',
    requirement: 'Log emissions for 100 unique days',
    category: 'Consistency',
    createdAt: new Date().toISOString(),
  },
  {
    badgeId: 'tree-planter',
    name: 'Tree Planter',
    description: 'Plant 10 trees',
    icon: 'Leaf',
    requirement: 'Plant 10 trees total',
    category: 'Action',
    createdAt: new Date().toISOString(),
  },
];

async function seedBadges() {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();

    console.log('Clearing existing badges...');
    await Badge.deleteMany({});

    console.log('Seeding badges...');
    const result = await Badge.insertMany(badgesData);

    console.log(`✅ Successfully seeded ${result.length} badges!`);
    console.log('Badge IDs:', result.map(b => b.badgeId).join(', '));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding badges:', error);
    process.exit(1);
  }
}

seedBadges();
