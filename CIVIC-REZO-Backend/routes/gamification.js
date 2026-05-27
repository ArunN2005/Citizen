/**
 * gamification.js — API routes for badges, points, challenges, rewards, leaderboard
 * Mounted at /api/gamification
 */

const express = require('express');
const router = express.Router();
const gamificationService = require('../services/GamificationService');
const { supabase } = require('../config/supabase');

// ================================================================
// BADGES
// ================================================================

/**
 * GET /api/gamification/badges?userId=<id>
 * Returns all badge definitions + which ones the user has earned.
 */
router.get('/badges', async (req, res) => {
  try {
    const userId = req.query.userId;

    const { data: allBadges } = await supabase
      .from('badges')
      .select('*')
      .order('display_order');

    if (!userId) {
      return res.json({ success: true, badges: allBadges || [], earned: [] });
    }

    // Get user's earned badges
    const { data: earnedBadges } = await supabase
      .from('user_badges')
      .select('badge_id, earned_at, badges(*)')
      .eq('user_id', userId);

    const earnedIds = new Set((earnedBadges || []).map(eb => eb.badge_id));

    const enrichedBadges = (allBadges || []).map(badge => ({
      ...badge,
      earned: earnedIds.has(badge.id),
      earnedAt: (earnedBadges || []).find(eb => eb.badge_id === badge.id)?.earned_at || null,
    }));

    res.json({
      success: true,
      badges: enrichedBadges,
      earned: earnedBadges || [],
      total: allBadges?.length || 0,
      earnedCount: earnedBadges?.length || 0,
    });
  } catch (error) {
    console.error('Badges error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/gamification/badges/evaluate
 * Trigger badge evaluation for a user (normally automatic, but callable manually).
 */
router.post('/badges/evaluate', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    const result = await gamificationService.evaluateBadges(userId);
    res.json({
      success: true,
      awarded: result.awarded,
      totalPoints: result.totalPoints,
      newlyAwarded: result.awarded.length,
    });
  } catch (error) {
    console.error('Badge evaluation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================================================================
// IMPACT POINTS
// ================================================================

/**
 * GET /api/gamification/points/:userId
 * Returns user's points balance and transaction history.
 */
router.get('/points/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const balance = await gamificationService.getPointsBalance(userId);
    const { history } = await gamificationService.getPointsHistory(userId, 50);

    res.json({ success: true, balance, history });
  } catch (error) {
    console.error('Points error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================================================================
// CHALLENGES
// ================================================================

/**
 * GET /api/gamification/challenges?userId=<id>
 * Returns all active challenges with user progress.
 */
router.get('/challenges', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      // Without a user, just return active challenges without progress
      const now = new Date().toISOString();
      const { data: challenges } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_active', true)
        .lte('starts_at', now)
        .gte('ends_at', now)
        .order('ends_at');

      return res.json({
        success: true,
        challenges: (challenges || []).map(c => ({
          ...c,
          userProgress: null,
        })),
      });
    }

    const result = await gamificationService.getActiveChallenges(userId);
    res.json({
      success: true,
      challenges: result.challenges,
      completed: result.challenges.filter(c => c.userProgress?.completed).length,
      total: result.challenges.length,
    });
  } catch (error) {
    console.error('Challenges error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/gamification/challenges/:challengeId/claim
 * Claim reward for a completed challenge.
 */
router.post('/challenges/:challengeId/claim', async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    const result = await gamificationService.claimChallengeReward(userId, challengeId);
    res.json(result);
  } catch (error) {
    console.error('Challenge claim error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/gamification/challenges/track
 * Tracks an action toward active challenges. Called internally.
 */
router.post('/challenges/track', async (req, res) => {
  try {
    const { userId, actionType } = req.body;
    if (!userId || !actionType) {
      return res.status(400).json({ success: false, error: 'userId and actionType are required' });
    }

    await gamificationService.trackChallengeProgress(userId, actionType);
    res.json({ success: true, message: 'Challenge progress tracked' });
  } catch (error) {
    console.error('Challenge track error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================================================================
// REWARDS
// ================================================================

/**
 * GET /api/gamification/rewards?userId=<id>
 * Returns reward catalog with user's points balance.
 */
router.get('/rewards', async (req, res) => {
  try {
    const userId = req.query.userId;
    const catalog = gamificationService.getRewardCatalog();

    let balance = 0;
    if (userId) {
      balance = await gamificationService.getPointsBalance(userId);
    }

    const enrichedCatalog = catalog.map(reward => ({
      ...reward,
      affordable: balance >= reward.cost,
    }));

    res.json({ success: true, rewards: enrichedCatalog, balance });
  } catch (error) {
    console.error('Rewards error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/gamification/rewards/:rewardId/redeem
 * Redeem a perk using impact points.
 */
router.post('/rewards/:rewardId/redeem', async (req, res) => {
  try {
    const { rewardId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    const result = await gamificationService.redeemReward(userId, rewardId);
    res.json(result);
  } catch (error) {
    console.error('Reward redeem error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================================================================
// ENHANCED LEADERBOARD
// ================================================================

/**
 * GET /api/gamification/leaderboard
 * Returns leaderboard with gamification data (badges, points).
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await gamificationService.getGamifiedLeaderboard(20);
    res.json({ success: true, leaderboard });
  } catch (error) {
    console.error('Gamified leaderboard error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;