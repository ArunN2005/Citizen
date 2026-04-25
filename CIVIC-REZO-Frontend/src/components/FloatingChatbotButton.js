import React, { useRef, useEffect, useState } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  View,
  Text,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FloatingChatbotButton = ({ onPress, style }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [showTooltip, setShowTooltip] = useState(true);

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();

    const tooltipTimer = setTimeout(() => {
      setShowTooltip(false);
    }, 5000);

    return () => {
      pulseAnimation.stop();
      clearTimeout(tooltipTimer);
    };
  }, []);

  const handlePress = () => {
    setShowTooltip(false);
    onPress();
  };

  return (
    <View style={[styles.container, style]} pointerEvents="box-none">
      {/* Pulse Ring */}
      <Animated.View 
        style={[
          styles.pulseRing,
          {
            transform: [{ scale: pulseAnim }],
          }
        ]} 
      />
      
      {/* Main Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityLabel="Open AI Assistant"
        accessibilityHint="Get help with app features and civic issues"
      >
        <Ionicons 
          name="chatbubble-ellipses" 
          size={26} 
          color="#FFFFFF" 
        />
      </TouchableOpacity>
      
      {/* Tooltip */}
      {showTooltip && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>Need help?</Text>
          <View style={styles.tooltipArrow} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 120 : 100,
    right: 20,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 20,
  },
  pulseRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(26, 26, 26, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(26, 26, 26, 0.12)',
    top: -6,
    left: -6,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  tooltip: {
    position: 'absolute',
    bottom: 68,
    right: -4,
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -5,
    right: 20,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1A1A1A',
  },
});

export default FloatingChatbotButton;
