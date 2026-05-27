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
import { LinearGradient } from 'expo-linear-gradient';

const RewardsScreen = ({ navigation }) => {
  const [balance, setBalance] = useState(0);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [redeemingId, setRedeemingId] = useState(null);

  useEffect(() => {
    loadUserAndRewards();
  }, []);

  const loadUserAndRewards = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      let uid = null;
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        uid = userData.id;
        setUserId(uid);
      }
      await fetchRewards(uid);
    } catch (e) {
      await fetchRewards(null);
    }
  };

  const fetchRewards = async (uid = userId) => {
    try {
      const url = uid
        ? `${apiClient.baseUrl}/api/gamification/rewards?userId=${uid}`
        : `${apiClient.baseUrl}/api/gamification/rewards`;
      const response = await makeApiCall(url, { method: 'GET' });
      if (response?.success) {
        setBalance(response.balance || 0);
        setRewards(response.rewards || []);
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRewards();
  };

  const handleRedeem = (reward) => {
    if (!userId) {
      Alert.alert('Login Required', 'Please log in to redeem rewards.');
      return;
    }

    if (balance < reward.cost) {
      Alert.alert(
        'Not Enough Points',
        `You need ${reward.cost - balance} more points to redeem this reward.`
      );
      return;
    }

    Alert.alert(
      'Confirm Redemption',
      `Spend ${reward.cost} points to redeem "${reward.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: async () => {
            setRedeemingId(reward.id);
            try {
              const response = await makeApiCall(
                `${apiClient.baseUrl}/api/gamification/rewards/${reward.id}/redeem`,
                {
                  method: 'POST',
                  body: JSON.stringify({ userId }),
                }
              );

              if (response?.success) {
                Alert.alert(
                  'Redeemed! 🎉',
                  `${reward.name} is yours! Your new balance is ${response.newBalance} points.`
                );
                fetchRewards(); // refresh
              } else {
                Alert.alert('Could not redeem', response?.error || 'Try again later.');
              }
            } catch (error) {
              Alert.alert('Error', 'Something went wrong.');
            } finally {
              setRedeemingId(null);
            }
          },
        },
      ]
    );
  };

  const renderRewardCard = (reward) => {
    const affordable = balance >= reward.cost;

    return (
      <View key={reward.id} style={[styles.rewardCard, !affordable && styles.rewardLocked]}>
        <View style={styles.rewardHeader}>
          <View style={[styles.rewardIconWrap, { backgroundColor: affordable ? '#FFF8E1' : '#F5F5F5' }]}>
            <MaterialCommunityIcons
              name={reward.icon || 'gift'}
              size={32}
              color={affordable ? '#f39c12' : '#B0B0B0'}
            />
          </View>
          <View style={styles.rewardInfo}>
            <Text style={[styles.rewardName, !affordable && { color: '#999' }]}>
              {reward.name}
            </Text>
            <Text style={[styles.rewardDesc, !affordable && { color: '#BBB' }]}>
              {reward.description}
            </Text>
          </View>
        </View>

        <View style={styles.rewardFooter}>
          <View style={styles.costBadge}>
            <MaterialCommunityIcons
              name="star-circle"
              size={18}
              color={affordable ? '#f39c12' : '#B0B0B0'}
            />
            <Text style={[styles.costText, !affordable && { color: '#999' }]}>
              {reward.cost} pts
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.redeemBtn,
              !affordable && styles.redeemBtnDisabled,
            ]}
            onPress={() => handleRedeem(reward)}
            disabled={!affordable || redeemingId === reward.id}
          >
            {redeemingId === reward.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[styles.redeemBtnText, !affordable && { color: '#999' }]}>
                {affordable ? 'Redeem' : 'Locked'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Impact Rewards</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Points Balance Banner */}
      <LinearGradient
        colors={['#f39c12', '#e67e22']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.balanceBanner}
      >
        <Text style={styles.balanceLabel}>Your Impact Points</Text>
        <Text style={styles.balanceAmount}>{balance.toLocaleString()}</Text>
        <Text style={styles.balanceHint}>Earn points by reporting issues and completing challenges!</Text>
      </LinearGradient>

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
          {/* Reward Cards */}
          {rewards.map(renderRewardCard)}

          {/* Empty State */}
          {rewards.length === 0 && !loading && (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="gift-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No rewards available</Text>
              <Text style={styles.emptySubText}>
                Check back soon for new perks to redeem!
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
  balanceBanner: {
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  balanceLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  balanceAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 4,
  },
  balanceHint: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  content: { padding: 15 },
  rewardCard: {
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
  rewardLocked: { opacity: 0.65 },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  rewardIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardInfo: { flex: 1, marginLeft: 12 },
  rewardName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  rewardDesc: { fontSize: 13, color: '#666', marginTop: 2 },
  rewardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costBadge: { flexDirection: 'row', alignItems: 'center' },
  costText: { fontSize: 16, fontWeight: 'bold', color: '#f39c12', marginLeft: 4 },
  redeemBtn: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  redeemBtnDisabled: { backgroundColor: '#E0E0E0' },
  redeemBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  emptyContainer: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: '#555', marginTop: 15 },
  emptySubText: { fontSize: 14, color: '#888', marginTop: 5, textAlign: 'center' },
});

export default RewardsScreen;