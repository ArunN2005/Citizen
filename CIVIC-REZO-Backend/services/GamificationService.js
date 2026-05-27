/**
 * GamificationService.js
 * Business logic for badges, impact points, and challenges.
 */

const { supabase } = require('../config/supabase');

class GamificationService {
  // ================================================================
  // BADGE EVALUATION
  // ================================================================

  /**
   * Evaluate and award any eligible badges for a user.
   * Call this after significant user actions (complaint submit, verify, resolve).
   * @param {string} userId
   * @returns {Promise<{awarded: Array, totalPoints: number}>}
   */
  async evaluateBadges(userId) {
    const awarded = [];
    let totalPoints = 0;

    // Get all badge definitions
    const { data: badges } = await supabase
      .from('badges')
      .select('*')
      .order('display_order');

    if (!badges || badges.length === 0) return { awarded, totalPoints };

    // Get badges user already has
    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId);

    const earnedBadgeIds = new Set((userBadges || []).map(ub => ub.badge_id));

    // Get user stats
    const stats = await this._getUserStats(userId);

    for (const badge of badges) {
      if (earnedBadgeIds.has(badge.id)) continue;

      const qualifies = this._checkBadgeQualification(badge, stats);
      if (qualifies) {
        // Award badge
        const { error: insertError } = await supabase
          .from('user_badges')
          .insert([{ user_id: userId, badge_id: badge.id }]);

        if (!insertError) {
          awarded.push(badge);
          totalPoints += badge.points_reward;

          // Credit points for badge
          await this._creditPoints(
            userId,
            badge.points_reward,
            'badge_reward',
            badge.id
          );
        }
      }
    }

    return { awarded, totalPoints };
  }

  /**
   * Check if user qualifies for a specific badge.
   */
  _checkBadgeQualification(badge, stats) {
    switch (badge.criteria_type) {
      case 'complaints_count':
        return stats.totalComplaints >= badge.criteria_value;
      case 'verified_count':
        return stats.verifiedReports >= badge.criteria_value;
      case 'resolved_count':
        return stats.resolvedReports >= badge.criteria_value;
      case 'photo_reports_count':
        return stats.photoReports >= badge.criteria_value;
      case 'quick_report':
        return stats.quickReports >= badge.criteria_value;
      case 'combined':
        // Civic Champion: total complaints + all other badges
        return stats.totalComplaints >= badge.criteria_value && stats.allOtherBadges >= 4;
      default:
        return false;
    }
  }

  /**
   * Fetch comprehensive user stats for badge evaluation.
   */
  async _getUserStats(userId) {
    // Total complaints
    const { count: totalComplaints } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Verified reports (status = 'verified' or 'resolved')
    const { count: verifiedReports } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', ['verified', 'resolved']);

    // Resolved reports
    const { count: resolvedReports } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'resolved');

    // Photo reports (complaints with images)
    const { count: photoReports } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('image_url', 'is', null);

    // Quick reports (within 1 hour of creation — approximated)
    const { count: quickReports } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Other badge count (for Civic Champion)
    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', userId);

    return {
      totalComplaints: totalComplaints || 0,
      verifiedReports: verifiedReports || 0,
      resolvedReports: resolvedReports || 0,
      photoReports: photoReports || 0,
      quickReports: quickReports || 0,
      allOtherBadges: (userBadges || []).length,
    };
  }

  // ================================================================
  // IMPACT POINTS
  // ================================================================

  /**
   * Get user's total impact points balance.
   */
  async getPointsBalance(userId) {
    const { data, error } = await supabase
      .from('impact_points')
      .select('amount');

    if (error) return 0;

    return data.reduce((sum, row) => sum + row.amount, 0);
  }

  /**
   * Get user's points transaction history.
   */
  async getPointsHistory(userId, limit = 20) {
    const { data, error } = await supabase
      .from('impact_points')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return { history: data || [], error };
  }

  /**
   * Credit points to a user.
   * @param {string} userId
   * @param {number} amount - positive integer
   * @param {string} reason - 'complaint_submitted', 'badge_reward', 'challenge_completed', 'verification_bonus'
   * @param {string} source - reference id (badge_id, challenge_id, complaint_id)
   */
  async _creditPoints(userId, amount, reason, source = null) {
    if (amount <= 0) return;

    const { error } = await supabase
      .from('impact_points')
      .insert([{
        user_id: userId,
        amount: amount,
        reason: reason,
        source: source,
      }]);

    if (error) {
      console.error('Error crediting points:', error.message);
    }
  }

  /**
   * Spend (deduct) points for reward redemption.
   */
  async spendPoints(userId, amount, reason, source = null) {
    const balance = await this.getPointsBalance(userId);
    if (balance < amount) {
      return { success: false, error: 'Insufficient points', balance };
    }

    const { error } = await supabase
      .from('impact_points')
      .insert([{
        user_id: userId,
        amount: -amount,
        reason: reason,
        source: source,
      }]);

    if (error) {
      return { success: false, error: error.message };
    }

    const newBalance = await this.getPointsBalance(userId);
    return { success: true, previousBalance: balance, newBalance };
  }

  /**
   * Award base points for submitting a complaint (10 pts per complaint).
   */
  async awardComplaintPoints(userId, complaintId) {
    await this._creditPoints(userId, 10, 'complaint_submitted', complaintId);
  }

  /**
   * Award bonus points when a complaint is verified (20 pts bonus).
   */
  async awardVerificationPoints(userId, complaintId) {
    await this._creditPoints(userId, 20, 'verification_bonus', complaintId);
  }

  // ================================================================
  // CHALLENGES
  // ================================================================

  /**
   * Get all active challenges with user progress.
   */
  async getActiveChallenges(userId) {
    const now = new Date().toISOString();

    const { data: challenges, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('is_active', true)
      .lte('starts_at', now)
      .gte('ends_at', now)
      .order('ends_at');

    if (error || !challenges) return { challenges: [], error };

    // Get user progress for each challenge
    const enhanced = await Promise.all(
      challenges.map(async (challenge) => {
        const { data: progress } = await supabase
          .from('challenge_progress')
          .select('*')
          .eq('user_id', userId)
          .eq('challenge_id', challenge.id)
          .maybeSingle();

        return {
          ...challenge,
          userProgress: progress || { current_count: 0, completed: false, claimed_at: null },
        };
      })
    );

    return { challenges: enhanced, error: null };
  }

  /**
   * Update progress toward a challenge for a user.
   * Call this when user performs relevant actions.
   */
  async trackChallengeProgress(userId, actionType) {
    // Find active challenges matching this action
    const now = new Date().toISOString();
    const { data: matchingChallenges } = await supabase
      .from('challenges')
      .select('*')
      .eq('is_active', true)
      .eq('target_action', actionType)
      .lte('starts_at', now)
      .gte('ends_at', now);

    if (!matchingChallenges || matchingChallenges.length === 0) return;

    for (const challenge of matchingChallenges) {
      // Check existing progress
      const { data: existing } = await supabase
        .from('challenge_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('challenge_id', challenge.id)
        .maybeSingle();

      if (existing) {
        if (existing.completed) continue; // already done

        const newCount = existing.current_count + 1;
        const completed = newCount >= challenge.target_count;

        await supabase
          .from('challenge_progress')
          .update({
            current_count: newCount,
            completed: completed,
          })
          .eq('id', existing.id);
      } else {
        // First progress entry
        await supabase
          .from('challenge_progress')
          .insert([{
            user_id: userId,
            challenge_id: challenge.id,
            current_count: 1,
            completed: challenge.target_count <= 1,
          }]);
      }
    }
  }

  /**
   * Claim reward for a completed challenge.
   */
  async claimChallengeReward(userId, challengeId) {
    // Verify progress
    const { data: progress } = await supabase
      .from('challenge_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .maybeSingle();

    if (!progress) {
      return { success: false, error: 'No progress found for this challenge' };
    }

    if (!progress.completed) {
      return { success: false, error: 'Challenge not yet completed' };
    }

    if (progress.claimed_at) {
      return { success: false, error: 'Reward already claimed' };
    }

    // Get challenge reward amount
    const { data: challenge } = await supabase
      .from('challenges')
      .select('points_reward')
      .eq('id', challengeId)
      .single();

    const reward = challenge ? challenge.points_reward : 50;

    // Mark as claimed
    await supabase
      .from('challenge_progress')
      .update({ claimed_at: new Date().toISOString() })
      .eq('id', progress.id);

    // Credit points
    await this._creditPoints(userId, reward, 'challenge_completed', challengeId);

    return { success: true, reward, message: `Claimed ${reward} points!` };
  }

  // ================================================================
  // ENHANCED LEADERBOARD
  // ================================================================

  /**
   * Get enhanced leaderboard with gamification data.
   */
  async getGamifiedLeaderboard(limit = 20) {
    const { data: volunteerUpdates } = await supabase
      .from('complaint_updates')
      .select('updated_by_id, users:updated_by_id(full_name, user_type)')
      .eq('new_status', 'volunteer_assigned');

    if (!volunteerUpdates) return [];

    const stats = {};
    for (const update of volunteerUpdates) {
      const userId = update.updated_by_id;
      if (!stats[userId]) {
        stats[userId] = {
          id: userId,
          name: update.users?.full_name || 'Volunteer',
          type: update.users?.user_type || 'volunteer',
          missionsCompleted: 0,
          badges: [],
          totalPoints: 0,
        };
      }
      stats[userId].missionsCompleted += 1;
    }

    const userIds = Object.keys(stats);
    if (userIds.length === 0) return [];

    // Fetch badges for all users
    const { data: allUserBadges } = await supabase
      .from('user_badges')
      .select('user_id, badges(name, icon)')
      .in('user_id', userIds);

    if (allUserBadges) {
      for (const ub of allUserBadges) {
        if (stats[ub.user_id] && ub.badges) {
          stats[ub.user_id].badges.push(ub.badges);
        }
      }
    }

    // Fetch points for all users
    const { data: allPoints } = await supabase
      .from('impact_points')
      .select('user_id, amount')
      .in('user_id', userIds);

    if (allPoints) {
      for (const pt of allPoints) {
        if (stats[pt.user_id]) {
          stats[pt.user_id].totalPoints += pt.amount;
        }
      }
    }

    const leaderboard = Object.values(stats).sort(
      (a, b) => b.totalPoints + b.missionsCompleted * 10 - (a.totalPoints + a.missionsCompleted * 10)
    );

    return leaderboard.slice(0, limit);
  }

  // ================================================================
  // REWARDS
  // ================================================================

  /**
   * Get available reward catalog.
   */
  getRewardCatalog() {
    return [
      { id: 'parking_pass', name: 'Digital Parking Pass', description: '1-day digital parking pass valid citywide.', icon: 'car-sport', cost: 200 },
      { id: 'event_ticket', name: 'Civic Event Ticket', description: 'Free entry to any city-sponsored civic event.', icon: 'ticket', cost: 500 },
      { id: 'certificate', name: 'Recognition Certificate', description: 'Official certificate of civic contribution from the city.', icon: 'document-text', cost: 300 },
      { id: 'priority', name: 'Priority Processing', description: 'Fast-track resolution for your next complaint.', icon: 'rocket', cost: 400 },
      { id: 'honor_wall', name: 'City Hall Honor Wall', description: 'Your name displayed on the digital honor wall at City Hall.', icon: 'star', cost: 1000 },
    ];
  }

  /**
   * Redeem a reward.
   */
  async redeemReward(userId, rewardId) {
    const catalog = this.getRewardCatalog();
    const reward = catalog.find(r => r.id === rewardId);
    if (!reward) {
      return { success: false, error: 'Reward not found' };
    }

    return await this.spendPoints(userId, reward.cost, 'perk_redeemed', rewardId);
  }
}

module.exports = new GamificationService();