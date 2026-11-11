/**
 * Task History Screen
 * Provides calendar day navigation, historical completion audit, and daily productivity breakdown
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useTasks } from '../hooks/useTasks';
import { TaskCard } from '../components/TaskCard';
import { ProgressCard } from '../components/ProgressCard';
import {
  getTodayDateString,
  formatDateDisplay,
  addDays,
  subDays,
  isToday,
} from '../utils/dateUtils';
import { AddTaskModal } from './AddTaskScreen';

export const HistoryScreen = () => {
  const { colors, isDark } = useTheme();
  const today = getTodayDateString();
  const [currentDate, setCurrentDate] = useState(today);

  const {
    tasks,
    stats,
    loading,
    refreshTasks,
    toggleTaskStatus,
    deleteTask,
    setSelectedDate,
  } = useTasks(currentDate);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  useFocusEffect(
    useCallback(() => {
      setSelectedDate(currentDate);
      refreshTasks();
    }, [currentDate, refreshTasks, setSelectedDate])
  );

  const handlePrevDay = () => {
    const prev = subDays(currentDate, 1);
    setCurrentDate(prev);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = addDays(currentDate, 1);
    setCurrentDate(next);
    setSelectedDate(next);
  };

  const handleJumpToToday = () => {
    setCurrentDate(today);
    setSelectedDate(today);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Screen Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Task History</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Review and audit past daily productivity
        </Text>
      </View>

      {/* Calendar Navigation Bar */}
      <View style={[styles.calendarBar, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <TouchableOpacity style={styles.arrowButton} onPress={handlePrevDay}>
          <Feather name="chevron-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.dateDisplayCol}>
          <Text style={[styles.dateDisplayText, { color: colors.textPrimary }]}>
            {formatDateDisplay(currentDate)}
          </Text>
          {isToday(currentDate) ? (
            <View style={[styles.todayTag, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.todayTagText, { color: colors.primary }]}>Today</Text>
            </View>
          ) : (
            <TouchableOpacity onPress={handleJumpToToday}>
              <Text style={[styles.jumpToToday, { color: colors.primary }]}>Jump to Today</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.arrowButton} onPress={handleNextDay}>
          <Feather name="chevron-right" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Daily Task List with Header Progress */}
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.occurrence_id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshTasks}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <ProgressCard
              total={stats.total}
              completed={stats.completed}
              pending={stats.pending}
              overdue={stats.overdue}
              completionRate={stats.completionRate}
            />

            <View style={styles.subHeaderRow}>
              <Text style={[styles.subHeaderTitle, { color: colors.textPrimary }]}>
                Tasks for this Date ({tasks.length})
              </Text>
              <TouchableOpacity
                style={[styles.addHistoryBtn, { backgroundColor: colors.surfaceSecondary }]}
                onPress={() => {
                  setEditingTask(null);
                  setModalVisible(true);
                }}
              >
                <Feather name="plus" size={14} color={colors.primary} />
                <Text style={[styles.addHistoryBtnText, { color: colors.primary }]}>Add Task</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onToggleStatus={toggleTaskStatus}
            onEdit={(t) => {
              setEditingTask(t);
              setModalVisible(true);
            }}
            onDelete={deleteTask}
          />
        )}
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Feather name="calendar" size={38} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              No tasks recorded on this date
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              There were no one-off or recurring tasks scheduled on {formatDateDisplay(currentDate)}.
            </Text>
          </View>
        }
      />

      <AddTaskModal
        visible={modalVisible}
        initialDate={currentDate}
        editingTask={editingTask}
        onClose={() => {
          setModalVisible(false);
          setEditingTask(null);
        }}
        onSaved={() => {
          setModalVisible(false);
          setEditingTask(null);
          refreshTasks();
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
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
  calendarBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginVertical: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  arrowButton: {
    padding: 8,
  },
  dateDisplayCol: {
    alignItems: 'center',
  },
  dateDisplayText: {
    fontSize: 14,
    fontWeight: '700',
  },
  todayTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 3,
  },
  todayTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  jumpToToday: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  listHeader: {
    marginBottom: 8,
  },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 8,
  },
  subHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  addHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  addHistoryBtnText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyContainer: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 30,
    alignItems: 'center',
    marginTop: 16,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
});

