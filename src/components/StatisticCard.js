/**
 * StatisticCard Component
 * Displays individual productivity KPIs with accent icons and subtle styling
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export const StatisticCard = ({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  subtext,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconWrapper,
            { backgroundColor: iconBg || (isDark ? '#1F2937' : '#F1F5F9') },
          ]}
        >
          <Feather name={icon || 'activity'} size={18} color={iconColor || colors.primary} />
        </View>
      </View>

      <Text style={[styles.value, { color: colors.textPrimary }]} numberOfLines={1}>
        {value}
      </Text>

      <Text style={[styles.label, { color: colors.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>

      {subtext ? (
        <Text style={[styles.subtext, { color: colors.textMuted }]} numberOfLines={1}>
          {subtext}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginVertical: 6,
    flex: 1,
    minWidth: '45%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  subtext: {
    fontSize: 11,
    marginTop: 2,
  },
});

