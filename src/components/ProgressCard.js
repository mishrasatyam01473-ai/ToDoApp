/**
 * ProgressCard Component
 * Displays real-time daily progress, visual circular indicator, and dynamic motivational summary
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export const ProgressCard = ({
  total = 0,
  completed = 0,
  pending = 0,
  overdue = 0,
  completionRate = 0,
}) => {
  const { colors, isDark } = useTheme();

  // Circle dimensions
  const size = 94;
  const strokeWidth = 9;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (circumference * Math.min(100, Math.max(0, completionRate))) / 100;

  // Dynamic motivational message
  const getMotivationalMessage = () => {
    if (total === 0) {
      return 'No tasks planned yet. Add a task to kickstart your day!';
    }
    if (completionRate === 100) {
      return "Fantastic achievement! You have completed all today's tasks!";
    }
    if (completionRate >= 75) {
      return 'Outstanding momentum! You are almost at the finish line.';
    }
    if (completionRate >= 50) {
      return 'Halfway there! Keep up the focus and finish strong.';
    }
    if (completionRate > 0) {
      return 'Great start! Keep checking off your pending items.';
    }
    return 'Your daily roadmap is ready. Take on your first task!';
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={styles.topRow}>
        {/* Left Side: Progress Statistics */}
        <View style={styles.textContainer}>
          <Text style={[styles.heading, { color: colors.textSecondary }]}>Today's Progress</Text>
          <View style={styles.rateRow}>
            <Text style={[styles.rateValue, { color: colors.textPrimary }]}>{completionRate}%</Text>
            <Text style={[styles.rateSub, { color: colors.textMuted }]}>completed</Text>
          </View>
          <Text style={[styles.motivational, { color: colors.textSecondary }]}>
            {getMotivationalMessage()}
          </Text>
        </View>

        {/* Right Side: Circular SVG Indicator */}
        <View style={styles.circleWrapper}>
          <Svg width={size} height={size}>
            <G rotation="-90" origin={`${center}, ${center}`}>
              {/* Background Track */}
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={isDark ? '#1F2937' : '#E2E8F0'}
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Progress Bar */}
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={colors.primary}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </G>
          </Svg>
          <View style={styles.innerIcon}>
            <Feather
              name={completionRate === 100 ? 'award' : 'activity'}
              size={22}
              color={colors.primary}
            />
          </View>
        </View>
      </View>

      {/* Bottom Breakdown Pills */}
      <View style={[styles.pillsRow, { borderTopColor: colors.divider }]}>
        <View style={styles.pill}>
          <Text style={[styles.pillValue, { color: colors.textPrimary }]}>{total}</Text>
          <Text style={[styles.pillLabel, { color: colors.textMuted }]}>Total</Text>
        </View>

        <View style={styles.pillDivider} />

        <View style={styles.pill}>
          <Text style={[styles.pillValue, { color: colors.completed }]}>{completed}</Text>
          <Text style={[styles.pillLabel, { color: colors.textMuted }]}>Completed</Text>
        </View>

        <View style={styles.pillDivider} />

        <View style={styles.pill}>
          <Text style={[styles.pillValue, { color: colors.pending }]}>{pending}</Text>
          <Text style={[styles.pillLabel, { color: colors.textMuted }]}>Pending</Text>
        </View>

        {overdue > 0 && (
          <>
            <View style={styles.pillDivider} />
            <View style={styles.pill}>
              <Text style={[styles.pillValue, { color: colors.overdue }]}>{overdue}</Text>
              <Text style={[styles.pillLabel, { color: colors.textMuted }]}>Overdue</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    paddingRight: 14,
  },
  heading: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 4,
  },
  rateValue: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  rateSub: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
  },
  motivational: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  circleWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerIcon: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  pill: {
    alignItems: 'center',
  },
  pillValue: {
    fontSize: 17,
    fontWeight: '700',
  },
  pillLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  pillDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
  },
});

