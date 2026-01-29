import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import colors from '../theme/colors';

interface BottomNavigationProps {
  currentScreen: 'Map' | 'SOS' | 'Profile';
  onNavigate: (screen: 'Map' | 'SOS' | 'Profile') => void;
}

export default function BottomNavigation({ currentScreen, onNavigate }: BottomNavigationProps) {
  const tabs = [
    {
      id: 'SOS',
      label: 'SOS',
      icon: '🚨',
      activeIcon: '🚨',
    },
    {
      id: 'Map',
      label: 'Home',
      icon: '🏠',
      activeIcon: '🏠',
    },
    {
      id: 'Profile',
      label: 'Profile',
      icon: '👤',
      activeIcon: '👤',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = currentScreen === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => onNavigate(tab.id as 'Map' | 'SOS' | 'Profile')}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
                <Text style={styles.icon}>
                  {isActive ? tab.activeIcon : tab.icon}
                </Text>
              </View>
              <Text style={[styles.label, isActive && styles.activeLabel]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'android' ? 16 : 24,
    zIndex: 100,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    position: 'relative',
  },
  activeTab: {
    // Active tab styling
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  activeIconContainer: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  icon: {
    fontSize: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.light,
    letterSpacing: 0.2,
  },
  activeLabel: {
    color: colors.primary,
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});
