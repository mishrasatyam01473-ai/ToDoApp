/**
 * Productivity Analytics Screen
 * Renders key performance metrics, interactive Line Chart, Bar Chart, and Dot Grid
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { StatisticCard } from '../components/StatisticCard';
import { LineChart } from '../components/LineChart';
import { BarChart } from '../components/BarChart';
import { DotChart } from '../components/DotChart';

export const AnalyticsScreen = () => {
  const { colors, isDark } = useTheme();

  const {
    summary,
    lineChartData,
    lineTimeframe,
    changeLineTimeframe,
    barChartData,
    barMode,
    changeBarMode,
    dotChartData,
    dotTimeframe,
    changeDotTimeframe,
    loading,
    refreshAnalytics,
  } = useAnalytics();

  useFocusEffect(
    useCallback(() => {
      refreshAnalytics();
    }, [refreshAnalytics])
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshAnalytics}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Productivity Analytics
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Real-time performance tracked offline on your device
          </Text>
        </View>

        {/* Highlight Streak Cards Row */}
        {summary && (
          <View style={styles.streakRow}>
            <View
              style={[
                styles.highlightCard,
                { backgroundColor: isDark ? '#132822' : '#E6FFFA', borderColor: colors.primary },
              ]}
            >
              <View style={styles.highlightHeader}>
                <Feather name="zap" size={20} color={colors.primary} />
                <Text style={[styles.highlightTitle, { color: colors.primary }]}>
                  Current Streak
                </Text>
              </View>
              <Text style={[styles.highlightValue, { color: colors.textPrimary }]}>
                {summary.currentStreak} {summary.currentStreak === 1 ? 'Day' : 'Days'}
              </Text>
              <Text style={[styles.highlightSub, { color: colors.textSecondary }]}>
                Consecutive task completion
              </Text>
            </View>

            <View
              style={[
                styles.highlightCard,
                { backgroundColor: isDark ? '#231E3D' : '#EEF2FF', borderColor: colors.accent },
              ]}
            >
              <View style={styles.highlightHeader}>
                <Feather name="award" size={20} color={colors.accent} />
                <Text style={[styles.highlightTitle, { color: colors.accent }]}>
                  Best Streak
                </Text>
              </View>
              <Text style={[styles.highlightValue, { color: colors.textPrimary }]}>
                {summary.longestStreak} {summary.longestStreak === 1 ? 'Day' : 'Days'}
              </Text>
              <Text style={[styles.highlightSub, { color: colors.textSecondary }]}>
                Personal all-time record
              </Text>
            </View>
          </View>
        )}

        {/* High-level KPI Grid */}
        {summary && (
          <View style={styles.kpiGrid}>
            <View style={styles.kpiRow}>
              <StatisticCard
                icon="check-circle"
                iconColor={colors.completed}
                iconBg={colors.completedBg}
                label="Overall Completion"
                value={`${summary.overallCompletionRate}%`}
                subtext={`${summary.totalCompleted} of ${summary.totalCreated} total`}
              />
              <StatisticCard
                icon="trending-up"
                iconColor={colors.accent}
                iconBg={colors.accentLight}
                label="Avg Daily Rate"
                value={`${summary.avgDailyCompletionRate}%`}
                subtext="Average per active day"
              />
            </View>

            <View style={styles.kpiRow}>
              <StatisticCard
                icon="calendar"
                iconColor="#3B82F6"
                iconBg="#DBEAFE"
                label="Best Weekday"
                value={summary.mostProductiveDay}
                subtext="Highest task completion rate"
              />
              <StatisticCard
                icon="alert-circle"
                iconColor={colors.overdue}
                iconBg={colors.overdueBg}
                label="Overdue Tasks"
                value={summary.totalOverdue}
                subtext={summary.totalOverdue > 0 ? 'Requires attention' : 'All caught up!'}
              />
            </View>

            <View style={styles.kpiRow}>
              <StatisticCard
                icon="clock"
                iconColor={colors.pending}
                iconBg={colors.priorityMediumBg}
                label="Pending Tasks"
                value={summary.totalPending}
                subtext="Awaiting completion"
              />
              <StatisticCard
                icon="slash"
                iconColor="#8B5CF6"
                iconBg="#EDE9FE"
                label="Lowest Day"
                value={summary.leastProductiveDay}
                subtext="Lowest completion rate"
              />
            </View>
          </View>
        )}

        {/* Section 1: Line Graph - Productivity Trend */}
        <View style={styles.chartSection}>
          <LineChart
            data={lineChartData}
            timeframe={lineTimeframe}
            onTimeframeChange={changeLineTimeframe}
          />
        </View>

        {/* Section 2: Bar Graph - Task Completion Comparison */}
        <View style={styles.chartSection}>
          <BarChart
            data={barChartData}
            mode={barMode}
            onModeChange={changeBarMode}
          />
        </View>

        {/* Section 3: Dot Graph - Daily Productivity Grid */}
        <View style={styles.chartSection}>
          <DotChart
            data={dotChartData}
            timeframe={dotTimeframe}
            onTimeframeChange={changeDotTimeframe}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  highlightCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  highlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  highlightTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  highlightValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  highlightSub: {
    fontSize: 11,
    marginTop: 2,
  },
  kpiGrid: {
    marginVertical: 4,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartSection: {
    marginTop: 6,
  },
});

