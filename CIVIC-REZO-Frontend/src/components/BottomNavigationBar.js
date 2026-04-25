import React, { useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Platform,
  Dimensions,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const BottomNavigationBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const focusedOptions = descriptors[state.routes[state.index].key].options;

  // Animations
  const tabPositions = React.useRef(
    state.routes.map((_, i) => new Animated.Value(i === state.index ? 1 : 0))
  ).current;

  useEffect(() => {
    state.routes.forEach((_, i) => {
      Animated.spring(tabPositions[i], {
        toValue: i === state.index ? 1 : 0,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }).start();
    });
  }, [state.index]);

  if (focusedOptions.tabBarVisible === false) {
    return null;
  }

  const getIconName = (routeName, isFocused) => {
    switch (routeName) {
      case 'Home':
        return isFocused ? 'grid' : 'grid-outline';
      case 'ComplaintMap':
        return isFocused ? 'map' : 'map-outline';
      case 'SubmitComplaint':
        return 'add';
      case 'Notifications':
        return isFocused ? 'notifications' : 'notifications-outline';
      case 'Profile':
        return isFocused ? 'person' : 'person-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const getLabel = (routeName) => {
    switch (routeName) {
      case 'Home': return 'Home';
      case 'ComplaintMap': return 'Map';
      case 'SubmitComplaint': return 'Report';
      case 'Notifications': return 'Alerts';
      case 'Profile': return 'Profile';
      default: return routeName;
    }
  };

  const centerIndex = Math.floor(state.routes.length / 2);

  return (
    <View style={[
      styles.container,
      { paddingBottom: insets.bottom > 0 ? insets.bottom : 8 }
    ]}>
      <View style={styles.tabsContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const isCenter = index === centerIndex;

          const iconName = getIconName(route.name, isFocused);
          const label = getLabel(route.name);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Center button (Submit Complaint)
          if (isCenter) {
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                onPress={onPress}
                style={styles.centerButtonContainer}
                activeOpacity={0.8}
              >
                <View style={styles.centerButton}>
                  <Ionicons name="add" size={28} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            );
          }

          // Regular tab
          const translateY = tabPositions[index].interpolate({
            inputRange: [0, 1],
            outputRange: [0, -2],
          });

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              <Animated.View
                style={[
                  styles.tabContent,
                  { transform: [{ translateY }] }
                ]}
              >
                <Ionicons
                  name={iconName}
                  size={22}
                  color={isFocused ? '#1A1A1A' : '#9CA3AF'}
                />
                <Text style={[
                  styles.tabLabel,
                  isFocused && styles.tabLabelActive
                ]}>
                  {label}
                </Text>
                {isFocused && <View style={styles.activeIndicator} />}
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    zIndex: 1000,
  },
  tabsContainer: {
    flexDirection: 'row',
    height: 56,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 56,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    color: '#1A1A1A',
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1A1A1A',
  },
  centerButtonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  centerButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default BottomNavigationBar;
