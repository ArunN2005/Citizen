/**
 * seed_gamification.js
 * Populates default badges, weekly challenges, and reward catalog.
 * Run: node CIVIC-REZO-Backend/scripts/seed_gamification.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Default Badges ────────────────────────────────────────
const DEFAULT_BADGES = [
  {
    name: 'First Reporter',
    description: 'Submitted your very first civic report. Welcome to the community!',
    icon: 'flag-checkered',
    criteria_type: 'complaints_count',
    criteria_value: 1,
    points_reward: 50,
    display_order: 1,
  },
  {
    name: 'Verified Contributor',
    description: '5 of your reports have been verified by officials. Your voice matters!',
    icon: 'shield-checkmark',
    criteria_type: 'verified_count',
    criteria_value: 5,
    points_reward: 100,
    display_order: 2,
  },
  {
    name: 'Problem Solver',
    description: '3 complaints you reported have been marked resolved. Making real change!',
    icon: 'checkmark-circle',
    criteria_type: 'resolved_count',
    criteria_value: 3,
    points_reward: 150,
    display_order: 3,
  },
  {
    name: 'Community Hero',
    description: '20 reports submitted. You are a true pillar of the community!',
    icon: 'heart-circle',
    criteria_type: 'complaints_count',
    criteria_value: 20,
    points_reward: 250,
    display_order: 4,
  },
  {
    name: 'Civic Champion',
    description: '50 reports submitted with all other badges earned. The ultimate civic champion!',
    icon: 'ribbon',
    criteria_type: 'combined',
    criteria_value: 50,
    points_reward: 500,
    display_order: 5,
  },
  {
    name: 'Early Bird',
    description: 'Reported an issue within the first hour of it being detected.',
    icon: 'sunny',
    criteria_type: 'quick_report',
    criteria_value: 1,
    points_reward: 75,
    display_order: 6,
  },
  {
    name: 'Photo Verified',
    description: '10 of your reports include verified photo evidence.',
    icon: 'camera',
    criteria_type: 'photo_reports_count',
    criteria_value: 10,
    points_reward: 100,
    display_order: 7,
  },
];

// ─── Sample Weekly Challenges ─────────────────────────────
function createWeeklyChallenges() {
  const now = new Date();

  // Current week: start of current Monday
  const currentMonday = new Date(now);
  currentMonday.setDate(now.getDate() - now.getDay() + 1);
  currentMonday.setHours(0, 0, 0, 0);

  const currentSunday = new Date(currentMonday);
  currentSunday.setDate(currentMonday.getDate() + 6);
  currentSunday.setHours(23, 59, 59, 999);

  // Next week
  const nextMonday = new Date(currentMonday);
  nextMonday.setDate(currentMonday.getDate() + 7);
  const nextSunday = new Date(nextMonday);
  nextSunday.setDate(nextMonday.getDate() + 6);
  nextSunday.setHours(23, 59, 59, 999);

  return [
    {
      title: 'Pothole Patrol',
      description: 'Report 3 potholes in your area this week and help make roads safer.',
      icon: 'warning',
      target_count: 3,
      target_action: 'report_pothole',
      points_reward: 75,
      starts_at: currentMonday.toISOString(),
      ends_at: currentSunday.toISOString(),
      is_active: true,
    },
    {
      title: 'Green Guardian',
      description: 'Report 5 garbage dumping or tree-related issues. Keep the city clean!',
      icon: 'leaf',
      target_count: 5,
      target_action: 'report_garbage',
      points_reward: 100,
      starts_at: currentMonday.toISOString(),
      ends_at: currentSunday.toISOString(),
      is_active: true,
    },
    {
      title: 'Community Watch',
      description: 'Verify 3 existing reports from other citizens this week.',
      icon: 'eye',
      target_count: 3,
      target_action: 'verify_report',
      points_reward: 60,
      starts_at: currentMonday.toISOString(),
      ends_at: currentSunday.toISOString(),
      is_active: true,
    },
    {
      title: 'Speed Responder',
      description: 'Submit a report within 1 hour of receiving a civic alert notification.',
      icon: 'flash',
      target_count: 1,
      target_action: 'quick_response',
      points_reward: 150,
      starts_at: currentMonday.toISOString(),
      ends_at: currentSunday.toISOString(),
      is_active: true,
    },
    {
      title: 'Weekend Warrior',
      description: 'Report 2 issues during Saturday and Sunday. Civic duty never sleeps!',
      icon: 'calendar',
      target_count: 2,
      target_action: 'report_any',
      points_reward: 50,
      starts_at: nextMonday.toISOString(),
      ends_at: nextSunday.toISOString(),
      is_active: true,
    },
  ];
}

// ─── Reward Catalog (stored as a static config — could be a DB table later) ──────────
const REWARD_CATALOG = [
  { name: 'Digital Parking Pass', description: '1-day digital parking pass valid citywide.', icon: 'car', cost: 200 },
  { name: 'Civic Event Ticket', description: 'Free entry to any city-sponsored civic event.', icon: 'ticket', cost: 500 },
  { name: 'Recognition Certificate', description: 'Official certificate of civic contribution from the city.', icon: 'document-text', cost: 300 },
  { name: 'Priority Processing', description: 'Fast-track resolution for your next complaint.', icon: 'rocket', cost: 400 },
  { name: 'City Hall Honor Wall', description: 'Your name permanently displayed on the digital honor wall at City Hall.', icon: 'star', cost: 1000 },
];

// ─── Seed Functions ───────────────────────────────────────

async function seedBadges() {
  console.log('🏅 Seeding badges...');

  for (const badge of DEFAULT_BADGES) {
    // Check if badge already exists
    const { data: existing } = await supabase
      .from('badges')
      .select('id')
      .eq('name', badge.name)
      .single();

    if (existing) {
      console.log(`  ⏭  ${badge.name} — already exists`);
      continue;
    }

    const { error } = await supabase.from('badges').insert([badge]);
    if (error) {
      console.error(`  ❌ ${badge.name} — ${error.message}`);
    } else {
      console.log(`  ✅ ${badge.name} — created`);
    }
  }
}

async function seedChallenges() {
  console.log('🔥 Seeding weekly challenges...');

  const challenges = createWeeklyChallenges();

  for (const challenge of challenges) {
    const { data: existing } = await supabase
      .from('challenges')
      .select('id')
      .eq('title', challenge.title)
      .gte('starts_at', challenge.starts_at)
      .single();

    if (existing) {
      console.log(`  ⏭  ${challenge.title} — already exists for this week`);
      continue;
    }

    const { error } = await supabase.from('challenges').insert([challenge]);
    if (error) {
      console.error(`  ❌ ${challenge.title} — ${error.message}`);
    } else {
      console.log(`  ✅ ${challenge.title} — created (ends ${new Date(challenge.ends_at).toLocaleDateString()})`);
    }
  }
}

async function main() {
  console.log('🚀 Seeding gamification data for UrbanPulse...\n');

  await seedBadges();
  console.log('');
  await seedChallenges();

  console.log('\n✅ Seed complete!');
  console.log(`   Badges: ${DEFAULT_BADGES.length} defined`);
  console.log(`   Challenges: 5 weekly challenges defined`);
  console.log(`   Reward Catalog: ${REWARD_CATALOG.length} perks defined`);

  // Output reward catalog for reference
  console.log('\n📋 Reward Catalog:');
  for (const r of REWARD_CATALOG) {
    console.log(`   ${r.icon} ${r.name} — ${r.cost} pts: ${r.description}`);
  }
}

main();