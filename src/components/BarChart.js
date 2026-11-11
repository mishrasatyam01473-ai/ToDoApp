/**
 * Interactive SVG Bar Chart
 * Compares Completed vs Pending task volume across days or weeks
 * Features dual-color grouped bars, legend, touch tooltips, and gridlines
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, {
  Rect,
  Line,
  Text as SvgText,
  G,
} from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const BarChart = ({ data, mode = 'weekly', onModeChange }) => {
  const { colors } = useTheme();
  const [selectedBar, setSelectedBar] = useState(null);

  if (!data || !data.bars || data.bars.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No comparison data available yet.
        </Text>
      </View>
    );
  }

  const bars = data.bars;
  const chartWidth = SCREEN_WIDTH - 48;
  const chartHeight = 200;
  const paddingLeft = 32;
  const paddingRight = 16;
  const paddingTop = 25;
  const paddingBottom = 32;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  // Max value calculation for scale
  const maxVal = Math.max(
    5,
    ...bars.map((b) => Math.max(b.completed || 0, b.pending || 0))
  );

  // Grouped bar widths
  const groupWidth = innerWidth / bars.length;
  const barWidth = Math.max(4, Math.min(14, groupWidth * 0.32));
  const barGap = 3;

  const getY = (val) => {
    return paddingTop + innerHeight - (val / maxVal) * innerHeight;
  };

  const getBarHeight = (val) => {
    return (val / maxVal) * innerHeight;
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      {/* Header with Title and Mode Switcher */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Task Volume Comparison</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Completed vs. Pending Tasks</Text>
        </View>

        {onModeChange && (
          <View style={[styles.tabGroup, { backgroundColor: colors.surfaceSecondary }]}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                mode === 'weekly' && { backgroundColor: colors.primary },
              ]}
              onPress={() => {
                setSelectedBar(null);
                onModeChange('weekly');
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: mode === 'weekly' ? colors.textInverse : colors.textSecondary },
                ]}
              >
                Weekly
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                mode === 'monthly' && { backgroundColor: colors.primary },
              ]}
              onPress={() => {
                setSelectedBar(null);
                onModeChange('monthly');
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: mode === 'monthly' ? colors.textInverse : colors.textSecondary },
                ]}
              >
                Monthly
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: colors.completed }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: colors.pending }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Pending</Text>
        </View>
      </View>

      {/* Tooltip on Tap */}
      {selectedBar && (
        <View style={[styles.tooltipContainer, { backgroundColor: colors.surfaceSecondary, borderColor: colors.cardBorder }]}>
          <Text style={[styles.tooltipTitle, { color: colors.textPrimary }]}>
            {selectedBar.label} {selectedBar.range ? `(${selectedBar.range})` : ''}
          </Text>
          <Text style={[styles.tooltipDetail, { color: colors.textSecondary }]}>
            Done: {selectedBar.completed}  •  Pending: {selectedBar.pending}  •  Total: {selectedBar.total}
          </Text>
        </View>
      )}

      {/* SVG Chart */}
      <Svg width={chartWidth} height={chartHeight}>
        {/* Horizontal gridlines */}
        {[0, Math.round(maxVal / 2), maxVal].map((val, idx) => {
          const y = getY(val);
          return (
            <G key={`bar-grid-${idx}`}>
              <Line
                x1={paddingLeft}
                y1={y}
                x2={chartWidth - paddingRight}
                y2={y}
                stroke={colors.chartGrid}
                strokeDasharray="3, 3"
                strokeWidth={1}
              />
              <SvgText
                x={paddingLeft - 6}
                y={y + 3}
                fill={colors.textMuted}
                fontSize={10}
                fontWeight="500"
                textAnchor="end"
              >
                {val}
              </SvgText>
            </G>
          );
        })}

        {/* Grouped Bars */}
        {bars.map((bar, idx) => {
          const groupCenterX = paddingLeft + idx * groupWidth + groupWidth / 2;
          const completedX = groupCenterX - barWidth - barGap / 2;
          const pendingX = groupCenterX + barGap / 2;

          const completedHeight = getBarHeight(bar.completed);
          const pendingHeight = getBarHeight(bar.pending);

          const completedY = paddingTop + innerHeight - completedHeight;
          const pendingY = paddingTop + innerHeight - pendingHeight;

          const isSelected = selectedBar && selectedBar.label === bar.label;

          return (
            <G key={`group-${idx}`}>
              {/* Invisible touch area */}
              <Rect
                x={groupCenterX - groupWidth / 2}
                y={paddingTop}
                width={groupWidth}
                height={innerHeight}
                fill="transparent"
                onPress={() => setSelectedBar(bar)}
              />

              {/* Completed Bar */}
              {bar.completed > 0 && (
                <Rect
                  x={completedX}
                  y={completedY}
                  width={barWidth}
                  height={completedHeight}
                  fill={colors.completed}
                  rx={3}
                  ry={3}
                  opacity={isSelected ? 1 : 0.85}
                  onPress={() => setSelectedBar(bar)}
                />
              )}

              {/* Pending Bar */}
              {bar.pending > 0 && (
                <Rect
                  x={pendingX}
                  y={pendingY}
                  width={barWidth}
                  height={pendingHeight}
                  fill={colors.pending}
                  rx={3}
                  ry={3}
                  opacity={isSelected ? 1 : 0.85}
                  onPress={() => setSelectedBar(bar)}
                />
              )}

              {/* X Axis Label */}
              <SvgText
                x={groupCenterX}
                y={chartHeight - 8}
                fill={isSelected ? colors.primary : colors.textMuted}
                fontSize={10}
                fontWeight={isSelected ? '700' : '500'}
                textAnchor="middle"
              >
                {bar.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>

      {!data.hasData && (
        <View style={styles.noDataOverlay}>
          <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
            No completed or pending tasks to compare yet.
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
    marginBottom: 8,
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
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  legendBox: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tooltipContainer: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
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
    marginTop: 8,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});

