import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * BadgeIcon — Reusable badge display component
 * Shows earned badges (colored) vs locked badges (greyed out).
 *
 * Props:
 *   badge     — { name, description, icon, points_reward }
 *   earned    — boolean, whether the user has earned this badge
 *   earnedAt  — ISO timestamp (optional)
 *   size      — 'small' | 'medium' | 'large' (default: 'medium')
 *   showDescription — boolean (default: true)
 */
const BadgeIcon = ({ badge, earned = false, earnedAt = null, size = 'medium', showDescription = true }) => {
  const sizes = {
    small: { icon: 36, container: 80, font: 12 },
    medium: { icon: 48, container: 110, font: 14 },
    large: { icon: 64, container: 140, font: 16 },
  };

  const s = sizes[size] || sizes.medium;

  const earnedColor = '#FFD700'; // gold
  const lockedColor = '#B0B0B0';
  const accentColor = earned ? earnedColor : lockedColor;

  const formattedDate = earnedAt
    ? new Date(earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <View style={[styles.container, { width: s.container }, earned ? styles.earned : styles.locked]}>
      <View style={[styles.iconCircle, { borderColor: accentColor, width: s.icon + 16, height: s.icon + 16 }]}>
        <MaterialCommunityIcons
          name={badge.icon || 'medal'}
          size={s.icon}
          color={accentColor}
        />
        {earned && (
          <View style={styles.checkBadge}>
            <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
          </View>
        )}
      </View>

      <Text
        style={[styles.name, { fontSize: s.font, color: earned ? '#333' : '#999' }]}
        numberOfLines={2}
      >
        {badge.name}
      </Text>

      {earned && formattedDate && (
        <Text style={styles.date}>{formattedDate}</Text>
      )}

      {showDescription && (
        <Text style={[styles.description, { color: earned ? '#666' : '#BBB' }]} numberOfLines={2}>
          {badge.description}
        </Text>
      )}

      {badge.points_reward > 0 && !earned && (
        <Text style={styles.pointsHint}>+{badge.points_reward} pts</Text>
      )}

      {earned && (
        <Text style={styles.pointsEarned}>+{badge.points_reward} pts</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 10,
    margin: 6,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  earned: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  locked: {
    opacity: 0.7,
  },
  iconCircle: {
    borderRadius: 100,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  name: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  date: {
    fontSize: 10,
    color: '#888',
    marginBottom: 4,
  },
  description: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
  pointsHint: {
    fontSize: 11,
    color: '#FFD700',
    fontWeight: '600',
    marginTop: 4,
  },
  pointsEarned: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 4,
  },
});

export default BadgeIcon;