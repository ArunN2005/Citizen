import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FloatingChatbotButton from '../../components/FloatingChatbotButton';

const { width } = Dimensions.get('window');

const CitizenDashboard = ({ navigation }) => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedUserData = await AsyncStorage.getItem('userData');
      if (storedUserData) {
        setUserData(JSON.parse(storedUserData));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove(['authToken', 'userData']);
            navigation.replace('Welcome');
          },
        },
      ]
    );
  };

  const actionItems = [
    {
      icon: 'add-circle-outline',
      title: 'New Report',
      subtitle: 'Submit civic concern',
      onPress: () => navigation.navigate('SubmitComplaint'),
    },
    {
      icon: 'documents-outline',
      title: 'My Reports',
      subtitle: 'Track progress',
      onPress: () => navigation.reset({ index: 0, routes: [{ name: 'InstagramFeed' }] }),
    },
    {
      icon: 'map-outline',
      title: 'Complaint Map',
      subtitle: 'View area status',
      onPress: () => navigation.navigate('ComplaintMap'),
    },
    {
      icon: 'bar-chart-outline',
      title: 'Transparency',
      subtitle: 'Impact statistics',
      onPress: () => navigation.navigate('CitizenTransparency'),
    },
    {
      icon: 'chatbubbles-outline',
      title: 'AI Assistant',
      subtitle: 'Get instant help',
      onPress: () => navigation.navigate('CivicChatbot'),
    },
    {
      icon: 'mic-outline',
      title: 'Voice Report',
      subtitle: 'Speak your concern',
      onPress: () => navigation.navigate('SubmitComplaint', { useVoice: true }),
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.brandMark}>CIVIC-REZO</Text>
          <Text style={styles.brandSub}>Institutional Portal</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={22} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={handleLogout}
          >
            <Text style={styles.avatarText}>
              {userData?.fullName?.charAt(0)?.toUpperCase() || 'C'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentInner}
      >
        {/* Welcome section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            Dashboard
          </Text>
          <Text style={styles.welcomeSub}>
            Welcome back, {userData?.fullName || 'Citizen'}
          </Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>PENDING</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>RESOLVED</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>IMPACT</Text>
          </View>
        </View>

        {/* Actions grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Text style={styles.sectionSub}>Report and track civic issues</Text>
        </View>

        <View style={styles.actionsGrid}>
          {actionItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionCard}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconBox}>
                <Ionicons name={item.icon} size={24} color="#1A1A1A" />
              </View>
              <Text style={styles.actionTitle}>{item.title}</Text>
              <Text style={styles.actionSub}>{item.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Profile card */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Profile</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.profileLabelRow}>
              <Ionicons name="mail-outline" size={18} color="#6B7280" />
              <Text style={styles.profileLabel}>Email</Text>
            </View>
            <Text style={styles.profileValue}>{userData?.email || '—'}</Text>
          </View>
          <View style={styles.profileDivider} />
          <View style={styles.profileRow}>
            <View style={styles.profileLabelRow}>
              <Ionicons name="call-outline" size={18} color="#6B7280" />
              <Text style={styles.profileLabel}>Phone</Text>
            </View>
            <Text style={styles.profileValue}>{userData?.phoneNumber || '—'}</Text>
          </View>
          <View style={styles.profileDivider} />
          <View style={styles.profileRow}>
            <View style={styles.profileLabelRow}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#6B7280" />
              <Text style={styles.profileLabel}>Status</Text>
            </View>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Active Citizen</Text>
            </View>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#1A1A1A" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Floating chatbot button */}
      <TouchableOpacity
        style={styles.chatFab}
        onPress={() => navigation.navigate('CivicChatbot')}
        activeOpacity={0.8}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {},
  brandMark: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 1,
  },
  brandSub: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  welcomeSub: {
    fontSize: 15,
    color: '#6B7280',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 20,
    marginBottom: 32,
    alignItems: 'center',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  actionCard: {
    width: (width - 52) / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 18,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 3,
  },
  actionSub: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 18,
    marginBottom: 20,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  profileLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  profileValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '400',
    maxWidth: '50%',
    textAlign: 'right',
  },
  profileDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1A1A1A',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 10,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  chatFab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 1000,
  },
});

export default CitizenDashboard;
