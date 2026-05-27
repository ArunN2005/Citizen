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
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { makeApiCall, apiClient } from '../../../config/supabase';
import BadgeIcon from '../../components/BadgeIcon';

const BadgesScreen = ({ navigation }) => {
  const [badges, setBadges] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    loadUserAndBadges();
  }, []);

  const loadUserAndBadges = async () => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        setUserId(userData.id);
        fetchBadges(userData.id);
      } else {
        fetchBadges(null);
      }
    } catch (e) {
      fetchBadges(null);
    }
  };

  const fetchBadges = async (uid = userId) => {
    try {
      const url = userId
        ? `${apiClient.baseUrl}/api/gamification/badges?userId=${userId}`
        : `${apiClient.baseUrl}/api/gamification/badges`;
      const response = await makeApiCall(url, { method: 'GET' });
      if (response?.success) {
        setBadges(response.badges || []);
        setEarnedBadges(response.earned || []);
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBadges();
  };

  const earnedBadgesList = badges.filter(b => b.earned);
  const lockedBadgesList = badges.filter(b => !b.earned);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Badges</Text>
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
          {/* Badge Progress Summary */}
          <View style={styles.summaryCard}>
            <MaterialCommunityIcons name="trophy" size={40} color="#f39c12" />
            <Text style={styles.summaryText}>
              {earnedBadgesList.length} / {badges.length} Badges Earned
            </Text>
            {badges.length > 0 && (
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${(earnedBadgesList.length / badges.length) * 100}%` },
                  ]}
                />
              </View>
            )}
          </View>

          {/* Earned Badges */}
          {earnedBadgesList.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>🏅 Earned Badges</Text>
              <View style={styles.badgeGrid}>
                {earnedBadgesList.map(badge => (
                  <BadgeIcon
                    key={badge.id}
                    badge={badge}
                    earned={true}
                    earnedAt={badge.earnedAt}
                    size="medium"
                  />
                ))}
              </View>
            </>
          )}

          {/* Locked Badges */}
          {lockedBadgesList.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>🔒 Badges to Unlock</Text>
              <View style={styles.badgeGrid}>
                {lockedBadgesList.map(badge => (
                  <BadgeIcon
                    key={badge.id}
                    badge={badge}
                    earned={false}
                    size="medium"
                  />
                ))}
              </View>
            </>
          )}

          {/* Empty State */}
          {badges.length === 0 && !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="ribbon-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No badges available yet.</Text>
              <Text style={styles.emptySubText}>
                Start reporting civic issues to earn your first badge!
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
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 12,
  },
  progressBarBg: {
    width: '100%',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
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

export default BadgesScreen;