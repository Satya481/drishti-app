import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import colors from '../theme/colors';

interface Props {
  selectedRoute: {
    safetyScore: number | null;
    safetyCategory: 'Safe' | 'Moderate' | 'Risky' | null;
    explanation: string[] | null;
    distance: number | null;
    duration: number | null;
    index?: number;
  } | null;
  safestRoute?: {
    index: number;
    safetyScore: number;
    safetyCategory?: 'Safe' | 'Moderate' | 'Risky';
    duration?: number;
  } | null;
  onSwitchToSafer?: () => void;
}

const MAX_EXPLANATIONS = 3;

export default function RouteSafetySummary({ selectedRoute, safestRoute, onSwitchToSafer }: Props) {
  if (!selectedRoute) return null;

  const { safetyScore, safetyCategory, explanation, distance, duration } = selectedRoute;

  const getBadgeStyle = () => {
    switch (safetyCategory) {
      case 'Safe':
        return { color: colors.risk.safe, bg: colors.risk.safeBg };
      case 'Moderate':
        return { color: colors.risk.moderate, bg: colors.risk.moderateBg };
      case 'Risky':
        return { color: colors.risk.high, bg: colors.risk.highBg };
      default:
        return { color: colors.primary, bg: colors.borderLight };
    }
  };

  const badgeStyle = getBadgeStyle();
  const badgeLabel = safetyCategory || 'Unknown';

  const bullets = (explanation || []).slice(0, MAX_EXPLANATIONS);

  // CTA logic - use deterministic condition
  const showSaferRouteCTA =
    selectedRoute &&
    selectedRoute.safetyCategory !== 'Safe' &&
    safestRoute &&
    safestRoute.safetyScore > (selectedRoute.safetyScore ?? 0) &&
    safestRoute.index !== (selectedRoute.index ?? null);

  const timeDiffMinutes = (safestRoute && selectedRoute && typeof safestRoute.duration === 'number' && typeof selectedRoute.duration === 'number') ? Math.round((safestRoute.duration - selectedRoute.duration) / 60) : null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.card}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
            <Text style={[styles.badgeText, { color: badgeStyle.color }]}>
              {badgeLabel}
            </Text>
            <Text style={[styles.scoreText, { color: badgeStyle.color }]}>
              {safetyScore ?? '—'}/100
            </Text>
          </View>

          <View style={styles.headerInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📍</Text>
              <Text style={styles.infoValue}>{distance ? formatDistance(distance) : '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>⏱️</Text>
              <Text style={styles.infoValue}>{duration ? formatDuration(duration) : '—'}</Text>
            </View>
          </View>
        </View>

        {/* Insights Section */}
        {bullets && bullets.length > 0 && (
          <View style={styles.insightsContainer}>
            <Text style={styles.insightsTitle}>Safety Insights</Text>
            {bullets.map((b, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{truncate(b, 100)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* CTA Section */}
        {showSaferRouteCTA && (
          <View style={[
            styles.ctaContainer, 
            selectedRoute.safetyCategory === 'Risky' ? styles.ctaRisky : styles.ctaModerate
          ]}>
            <View style={styles.ctaHeader}>
              <Text style={styles.ctaIcon}>🛡️</Text>
              <View style={styles.ctaTextContainer}>
                <Text style={styles.ctaTitle}>Safer Route Available</Text>
                <Text style={styles.ctaSubtitle}>
                  {timeDiffMinutes !== null 
                    ? `${timeDiffMinutes > 0 ? `+${timeDiffMinutes}` : timeDiffMinutes} min • Higher safety score` 
                    : 'Higher safety score'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onSwitchToSafer} style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Switch Route →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

function truncate(text: string, max: number) {
  if (!text) return '';
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + '…';
}

function formatDistance(meters: number) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return `${hours}h ${remaining}m`;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 120,
    zIndex: 11,
  },
  card: {
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.95)' : colors.white,
    borderRadius: 24,
    padding: 20,
    elevation: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    borderWidth: Platform.OS === 'ios' ? 1 : 0,
    borderColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    minWidth: 90,
    height: 90,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  badgeText: {
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  scoreText: {
    fontWeight: '700',
    fontSize: 20,
    letterSpacing: -0.5,
  },
  headerInfo: {
    flex: 1,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  infoLabel: {
    fontSize: 16,
    marginRight: 8,
  },
  infoValue: {
    fontSize: 15,
    color: colors.text.primary,
    fontWeight: '600',
  },
  insightsContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 6,
    marginRight: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  ctaContainer: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
  },
  ctaModerate: {
    backgroundColor: colors.risk.moderateBg,
    borderColor: colors.risk.moderate,
  },
  ctaRisky: {
    backgroundColor: colors.risk.highBg,
    borderColor: colors.risk.high,
  },
  ctaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ctaIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  ctaTextContainer: {
    flex: 1,
  },
  ctaTitle: {
    fontWeight: '700',
    fontSize: 15,
    color: colors.text.primary,
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  ctaSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  ctaButton: {
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ctaButtonText: {
    fontWeight: '700',
    fontSize: 15,
    color: colors.text.primary,
    letterSpacing: 0.3,
  },
});