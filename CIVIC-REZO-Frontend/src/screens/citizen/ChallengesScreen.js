import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { makeApiCall, apiClient } from '../../../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ChallengesScreen = ({ navigation }) => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [claimingId, setClaimingId] = useState(null);

  useEffect(() => {
    loadUserAndChallenges();
  }, []);

  const loadUserAndChallenges = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      let uid = null;
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        uid = userData.id;
        setUserId(uid);
      }
      await fetchChallenges(uid);
    } catch (e) {
      await fetchChallenges(null);
    }
  };

  const fetchChallenges = async (uid = userId) => {
    try {
      const url = uid
        ? `${apiClient.baseUrl}/api/gamification/challenges?userId=${uid}`
        : `${apiClient.baseUrl}/api/gamification/challenges`;
      const response = await makeApiCall(url, { method: 'GET' });
      if (response?.success) {
        setChallenges(response.challenges || []);
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchChallenges();
  };

  const handleClaim = async (challengeId) => {
    if (!userId) {
      Alert.alert('Login Required', 'Please log in to claim rewards.');
      return;
    }

    setClaimingId(challengeId);
    try {
      const response = await makeApiCall(
        `${apiClient.baseUrl}/api/gamification/challenges/${challengeId}/claim`,
        {
          method: 'POST',
          body: JSON.stringify({ userId }),
        }
      );
      
      if (response?.success) {
        Alert.alert('Reward Claimed! 🎉', `You earned ${response.reward} impact points!`);
        fetchChallenges(); // refresh
      } else {
        Alert.alert('Not so fast!', response?.error || 'Could not claim reward.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Try again later.');
    } finally {
      setClaimingId(null);
    }
  };

  const getTimeRemaining = (endsAt) => {
    const now = new Date();
    const end = new Date(endsAt);
    const diffMs = end - now;
    if (diffMs <= 0) return 'Expired';

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  const renderChallenge = (challenge) => {
    const progress = challenge.userProgress;
    const completed = progress?.completed;
    const claimed = progress?.claimed_at;
    const current = progress?.current_count || 0;
    const target = challenge.target_count;
    const progressPercent = Math.min((current / target) * 100, 100);

    return (
      <View key={challenge.id} style={[styles.card, completed && styles.cardCompleted]}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons
            name={challenge.icon || 'fire'}
            size={32}
            color={completed ? '#4CAF50' : '#f39c12'}
          />
          <View style={styles.cardTitleArea}>
            <Text style={styles.cardTitle}>{challenge.title}</Text>
            <Text style={styles.cardDesc}>{challenge.description}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {completed ? '✅ Completed' : `${current} / ${target}`}
            </Text>
            <Text style={styles.timeText}>{getTimeRemaining(challenge.ends_at)}</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercent}%` },
                completed && styles.progressBarCompleted,
              ]}
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.cardFooter}>
          <Text style={styles.rewardText}>🏆 {challenge.points_reward} pts reward</Text>
          {completed && !claimed && (
            <TouchableOpacity
              style={styles.claimBtn}
              onPress={() => handleClaim(challenge.id)}
              disabled={claimingId === challenge.id}
            >
              {claimingId === challenge.id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.claimBtnText}>Claim Reward</Text>
              )}
            </TouchableOpacity>
          )}
          {claimed && (
            <View style={styles.claimedBadge}>
              <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.claimedText}>Claimed</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const completedCount = challenges.filter(c => c.userProgress?.completed).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Weekly Challenges</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#f39c12" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#f39c12']} />
          }
        >
          {/* Summary */}
          {challenges.length > 0 && (
            <View style={styles.summaryCard}>
              <MaterialCommunityIcons name="fire" size={32} color="#f39c12" />
              <Text style={styles.summaryText}>
                {completedCount} / {challenges.length} Challenges Complete
              </Text>
            </View>
          )}

          {/* Challenge Cards */}
          {challenges.map(renderChallenge)}

          {/* Empty State */}
          {challenges.length === 0 && !loading && (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="calendar-remove" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No active challenges</Text>
              <Text style={styles.emptySubText}>
                Check back soon — new challenges drop weekly!
              </Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A1A',
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  backBtn: { padding: 5 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 15 },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardCompleted: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleArea: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cardDesc: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  progressSection: { marginBottom: 12 },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressText: { fontSize: 14, fontWeight: '600', color: '#555' },
  timeText: { fontSize: 12, color: '#999' },
  progressBarBg: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#f39c12',
    borderRadius: 4,
  },
  progressBarCompleted: { backgroundColor: '#4CAF50' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardText: { fontSize: 14, fontWeight: '600', color: '#f39c12' },
  claimBtn: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  claimBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  claimedText: {
    marginLeft: 4,
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 15,
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
    textAlign: 'center',
  },
});

export default ChallengesScreen;