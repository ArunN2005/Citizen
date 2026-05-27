-- ============================================================
-- Gamification Tables for UrbanPulse
-- Features: Badges, Impact Points, Weekly Challenges
-- Run: psql -h $SUPABASE_URL -U postgres -d postgres -f this_file.sql
-- Or execute via Supabase dashboard SQL editor
-- ============================================================

-- 1. BADGES — Badge definitions
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'medal',
  criteria_type TEXT NOT NULL,         -- 'complaints_count', 'verified_count', 'resolved_count', 'combined'
  criteria_value INTEGER NOT NULL,     -- threshold value
  points_reward INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USER_BADGES — Earned badges per user
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- 3. IMPACT_POINTS — Points ledger (allows history tracking)
CREATE TABLE IF NOT EXISTS impact_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,              -- positive for earn, negative for spend
  reason TEXT NOT NULL,                  -- 'badge_reward', 'complaint_submitted', 'challenge_completed', 'perk_redeemed'
  source TEXT,                           -- reference id (badge_id, challenge_id, complaint_id)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CHALLENGES — Weekly challenge definitions
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'fire',
  target_count INTEGER NOT NULL,         -- how many actions needed
  target_action TEXT NOT NULL,           -- 'report_pothole', 'report_garbage', 'verify_report', 'report_any'
  points_reward INTEGER NOT NULL DEFAULT 50,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CHALLENGE_PROGRESS — Per-user challenge tracking
CREATE TABLE IF NOT EXISTS challenge_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  current_count INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- ============================================================
-- RLS Policies
-- ============================================================

-- badges: everyone can read
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can read badges" ON badges;
CREATE POLICY "Everyone can read badges" ON badges
  FOR SELECT USING (true);

-- user_badges: authenticated users can read own, insert own
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own badges" ON user_badges;
CREATE POLICY "Users can read own badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all badges" ON user_badges;
CREATE POLICY "Admins can read all badges" ON user_badges
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin')
  );

-- impact_points: authenticated users can read own
ALTER TABLE impact_points ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own points" ON impact_points;
CREATE POLICY "Users can read own points" ON impact_points
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all points" ON impact_points;
CREATE POLICY "Admins can read all points" ON impact_points
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin')
  );

-- challenges: everyone can read active challenges
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can read challenges" ON challenges;
CREATE POLICY "Everyone can read challenges" ON challenges
  FOR SELECT USING (true);

-- challenge_progress: authenticated users read/write own progress
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own progress" ON challenge_progress;
CREATE POLICY "Users can manage own progress" ON challenge_progress
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_impact_points_user_id ON impact_points(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_user ON challenge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON challenges(is_active, ends_at);