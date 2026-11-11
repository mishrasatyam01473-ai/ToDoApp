/**
 * Interactive SVG Line Chart
 * Displays productivity completion percentage trends (7d, 30d, 90d)
 * Features grid lines, gradient area fill, interactive data points, and tooltips
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, {
  Path,
  Line,
  Circle,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
  G,
  Rect,
} from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const LineChart = ({ data, timeframe = 7, onTimeframeChange }) => {
  const { colors, isDark } = useTheme();
  const [selectedPoint, setSelectedPoint] = useState(null);

  if (!data || !data.points || data.points.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No productivity records available yet.
        </Text>
      </View>
    );
  }

  const points = data.points;
  const chartWidth = SCREEN_WIDTH - 48; // Padding container
  const chartHeight = 190;
  const paddingLeft = 36;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 30;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  // Coordinate mapping
  const getX = (index) => {
    if (points.length <= 1) return paddingLeft + innerWidth / 2;
    return paddingLeft + (index / (points.length - 1)) * innerWidth;
  };

  const getY = (val) => {
    // val is 0 to 100
    const clamped = Math.max(0, Math.min(100, val));
    return paddingTop + innerHeight - (clamped / 100) * innerHeight;
  };

  // Build SVG path
  let pathD = '';
  let areaD = '';

  points.forEach((pt, idx) => {
    const x = getX(idx);
    const y = getY(pt.completionRate);
    if (idx === 0) {
      pathD = `M ${x} ${y}`;
      areaD = `M ${x} ${paddingTop + innerHeight} L ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
      areaD += ` L ${x} ${y}`;
    }
  });

  const lastX = getX(points.length - 1);
  const firstX = getX(0);
  areaD += ` L ${lastX} ${paddingTop + innerHeight} L ${firstX} ${paddingTop + innerHeight} Z`;

  // Determine tick interval for X axis labels based on point count
  const labelInterval = points.length <= 7 ? 1 : points.length <= 30 ? 5 : 15;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      {/* Header with Title and Timeframe Filter */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Productivity Trend</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Daily Completion Rate (%)</Text>
        </View>

        {onTimeframeChange && (
          <View style={[styles.tabGroup, { backgroundColor: colors.surfaceSecondary }]}>
            {[7, 30, 90].map((days) => (
              <TouchableOpacity
                key={days}
                style={[
                  styles.tabButton,
                  timeframe === days && { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  setSelectedPoint(null);
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

      {/* Tooltip Popup when a point is tapped */}
      {selectedPoint && (
        <View style={[styles.tooltipContainer, { backgroundColor: colors.surfaceSecondary, borderColor: colors.cardBorder }]}>
          <Text style={[styles.tooltipTitle, { color: colors.textPrimary }]}>
            {selectedPoint.date} ({selectedPoint.completionRate}%)
          </Text>
          <Text style={[styles.tooltipDetail, { color: colors.textSecondary }]}>
            Completed: {selectedPoint.completed} / {selectedPoint.total} tasks
          </Text>
        </View>
      )}

      {/* SVG Chart */}
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <LinearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.primary} stopOpacity={0.4} />
            <Stop offset="100%" stopColor={colors.primary} stopOpacity={0.0} />
          </LinearGradient>
        </Defs>

        {/* Horizontal Grid lines at 0%, 25%, 50%, 75%, 100% */}
        {[0, 25, 50, 75, 100].map((val) => {
          const y = getY(val);
          return (
            <G key={`grid-${val}`}>
              <Line
                x1={paddingLeft}
                y1={y}
                x2={chartWidth - paddingRight}
                y2={y}
                stroke={colors.chartGrid}
                strokeDasharray="4, 4"
                strokeWidth={1}
              />
              <SvgText
                x={paddingLeft - 8}
                y={y + 4}
                fill={colors.textMuted}
                fontSize={10}
                fontWeight="500"
                textAnchor="end"
              >
                {`${val}%`}
              </SvgText>
            </G>
          );
        })}

        {/* Gradient Area Fill */}
        {data.hasData && <Path d={areaD} fill="url(#lineGrad)" />}

        {/* Trend Line */}
        {data.hasData && (
          <Path
            d={pathD}
            fill="none"
            stroke={colors.primary}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Data Points (Touchable) */}
        {points.map((pt, idx) => {
          const cx = getX(idx);
          const cy = getY(pt.completionRate);
          const isSelected = selectedPoint && selectedPoint.date === pt.date;

          return (
            <G key={`pt-${idx}`}>
              {/* Invisible larger hit target */}
              <Rect
                x={cx - 14}
                y={paddingTop}
                width={28}
                height={innerHeight}
                fill="transparent"
                onPress={() => setSelectedPoint(pt)}
              />
              {/* Point Circle */}
              <Circle
                cx={cx}
                cy={cy}
                r={isSelected ? 6 : 4}
                fill={isSelected ? colors.accent : colors.surface}
                stroke={isSelected ? colors.accent : colors.primary}
                strokeWidth={2}
                onPress={() => setSelectedPoint(pt)}
              />
            </G>
          );
        })}

        {/* X-Axis Dates */}
        {points.map((pt, idx) => {
          if (idx % labelInterval !== 0 && idx !== points.length - 1) return null;
          const x = getX(idx);
          return (
            <SvgText
              key={`xlabel-${idx}`}
              x={x}
              y={chartHeight - 8}
              fill={colors.textMuted}
              fontSize={10}
              fontWeight="500"
              textAnchor="middle"
            >
              {pt.label}
            </SvgText>
          );
        })}
      </Svg>

      {!data.hasData && (
        <View style={styles.noDataOverlay}>
          <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
            No tasks recorded for this period yet.
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

