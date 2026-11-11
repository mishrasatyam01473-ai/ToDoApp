/**
 * Interactive Dot Chart (Daily Productivity Consistency Grid)
 * Visualizes daily habit consistency and completion performance
 * Features interactive dot matrix, color intensity scale, and tap inspection
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Circle, Rect, G } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const DotChart = ({ data, timeframe = 30, onTimeframeChange }) => {
  const { colors, isDark } = useTheme();
  const [selectedDot, setSelectedDot] = useState(null);

  if (!data || !data.dots || data.dots.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No daily productivity dots recorded yet.
        </Text>
      </View>
    );
  }

  const dots = data.dots;
  const containerWidth = SCREEN_WIDTH - 48;

  // Grid layout calculation:
  // For 30 days: 6 columns x 5 rows or 7 columns (days of week)
  // Let's use 7 columns (representing weekly alignment)
  const columns = 7;
  const rows = Math.ceil(dots.length / columns);
  const dotSize = timeframe === 30 ? 18 : 12;
  const dotSpacing = timeframe === 30 ? 10 : 6;
  const gridWidth = columns * (dotSize + dotSpacing);
  const gridHeight = rows * (dotSize + dotSpacing);

  const getDotColor = (dot) => {
    if (dot.total === 0) {
      return isDark ? '#1F2937' : '#E2E8F0'; // Empty day
    }
    switch (dot.level) {
      case 3: // 80 - 100%
        return '#10B981'; // Vibrant emerald
      case 2: // 50 - 79%
        return '#34D399'; // Medium mint
      case 1: // 1 - 49%
        return '#A7F3D0'; // Light mint
      case 0: // 0% completed of > 0 tasks
      default:
        return isDark ? '#374151' : '#CBD5E1';
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      {/* Header and Timeframe switcher */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Daily Consistency Grid</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Productivity Heatmap</Text>
        </View>

        {onTimeframeChange && (
          <View style={[styles.tabGroup, { backgroundColor: colors.surfaceSecondary }]}>
            {[30, 90].map((days) => (
              <TouchableOpacity
                key={days}
                style={[
                  styles.tabButton,
                  timeframe === days && { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  setSelectedDot(null);
                  onTimeframeChange(days);
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: timeframe === days ? colors.textInverse : colors.textSecondary },
                  ]}
                >
                  {days}d
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Selected Dot Tooltip */}
      {selectedDot && (
        <View style={[styles.tooltipContainer, { backgroundColor: colors.surfaceSecondary, borderColor: colors.cardBorder }]}>
          <Text style={[styles.tooltipTitle, { color: colors.textPrimary }]}>
            {selectedDot.date} ({selectedDot.dayName})
          </Text>
          <Text style={[styles.tooltipDetail, { color: colors.textSecondary }]}>
            {selectedDot.total > 0
              ? `${selectedDot.completionRate}% Done (${selectedDot.completed}/${selectedDot.total} tasks)`
              : 'No tasks scheduled on this day'}
          </Text>
        </View>
      )}

      {/* Dot Grid */}
      <View style={styles.svgWrapper}>
        <Svg width={gridWidth} height={gridHeight}>
          {dots.map((dot, idx) => {
            const col = idx % columns;
            const row = Math.floor(idx / columns);
            const cx = col * (dotSize + dotSpacing) + dotSize / 2;
            const cy = row * (dotSize + dotSpacing) + dotSize / 2;
            const isSelected = selectedDot && selectedDot.date === dot.date;

            return (
              <G key={`dot-${idx}`}>
                {/* Touch target */}
                <Rect
                  x={cx - dotSize / 2 - dotSpacing / 2}
                  y={cy - dotSize / 2 - dotSpacing / 2}
                  width={dotSize + dotSpacing}
                  height={dotSize + dotSpacing}
                  fill="transparent"
                  onPress={() => setSelectedDot(dot)}
                />
                {/* Visual Dot */}
                <Circle
                  cx={cx}
                  cy={cy}
                  r={isSelected ? dotSize / 2 + 2 : dotSize / 2}
                  fill={getDotColor(dot)}
                  stroke={isSelected ? colors.accent : 'transparent'}
                  strokeWidth={2}
                  onPress={() => setSelectedDot(dot)}
                />
              </G>
            );
          })}
        </Svg>
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        <Text style={[styles.legendLabel, { color: colors.textMuted }]}>Less</Text>
        <View style={[styles.legendDot, { backgroundColor: isDark ? '#1F2937' : '#E2E8F0' }]} />
        <View style={[styles.legendDot, { backgroundColor: '#A7F3D0' }]} />
        <View style={[styles.legendDot, { backgroundColor: '#34D399' }]} />
        <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
        <Text style={[styles.legendLabel, { color: colors.textMuted }]}>More</Text>
      </View>

      {!data.hasData && (
        <View style={styles.noDataOverlay}>
          <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
            Tap any dot to view daily completion details.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginVertical: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  tabGroup: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
  },
  tabButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tooltipContainer: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    alignSelf: 'center',
  },
  tooltipTitle: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  tooltipDetail: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  svgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  legendLabel: {
    fontSize: 10,
    marginHorizontal: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 3,
  },
  emptyContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginVertical: 10,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  noDataOverlay: {
    marginTop: 6,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
});

