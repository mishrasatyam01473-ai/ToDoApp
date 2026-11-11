/**
 * Home Dashboard Screen
 * Personalized greeting, live progress card, quick stats, upcoming task list, and Quick Add button
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { ProgressCard } from '../components/ProgressCard';
import { TaskCard } from '../components/TaskCard';
import { useTasks } from '../hooks/useTasks';
import {
  getTodayDateString,
  formatDateDisplay,
  getGreeting,
  isTaskOverdue,
} from '../utils/dateUtils';
import { AddTaskModal } from './AddTaskScreen';

export const HomeScreen = ({ navigation }) => {
  const { colors, isDark, userName } = useTheme();
  const today = getTodayDateString();

  const {
    tasks,
    stats,
    loading,
    refreshTasks,
    toggleTaskStatus,
    deleteTask,
  } = useTasks(today);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Refresh tasks whenever Home comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshTasks();
    }, [refreshTasks])
  );

  const openAddModal = () => {
    setEditingTask(null);
    setModalVisible(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setModalVisible(true);
  };

  // Filter tasks into Today's upcoming/pending and completed
  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

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
            onRefresh={refreshTasks}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Top Greeting & Date Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textPrimary }]}>
              {getGreeting(userName)}
            </Text>
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
              {formatDateDisplay(today)}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.quickAddButton, { backgroundColor: colors.primary }]}
            onPress={openAddModal}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={20} color={colors.textInverse} />
          </TouchableOpacity>
        </View>

        {/* Live Daily Progress Card */}
        <ProgressCard
          total={stats.total}
          completed={stats.completed}
          pending={stats.pending}
          overdue={stats.overdue}
          completionRate={stats.completionRate}
        />

        {/* Overdue Alert Banner if any past tasks remain unfinished */}
        {stats.overdue > 0 && (
          <TouchableOpacity
            style={[styles.overdueBanner, { backgroundColor: colors.overdueBg, borderColor: colors.overdue }]}
            onPress={() => navigation.navigate('Tasks', { initialFilter: 'overdue' })}
            activeOpacity={0.8}
          >
            <Feather name="alert-triangle" size={18} color={colors.overdue} />
            <View style={styles.overdueBannerTextCol}>
              <Text style={[styles.overdueBannerTitle, { color: colors.overdue }]}>
                {stats.overdue} Overdue {stats.overdue === 1 ? 'Task' : 'Tasks'}
              </Text>
              <Text style={[styles.overdueBannerSub, { color: colors.overdue }]}>
                Tap to review incomplete past tasks
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.overdue} />
          </TouchableOpacity>
        )}

        {/* Today's Tasks Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Today's Roadmap ({tasks.length})
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* Pending Tasks List */}
        {pendingTasks.length > 0 ? (
          pendingTasks.map((item) => (
            <TaskCard
              key={item.occurrence_id}
              task={item}
              onToggleStatus={toggleTaskStatus}
              onEdit={openEditModal}
              onDelete={deleteTask}
            />
          ))
        ) : tasks.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Feather name="check-circle" size={36} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No tasks scheduled yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Plan your day! Tap "+ Quick Add" or the button below to add your first task.
            </Text>
            <TouchableOpacity
              style={[styles.createFirstBtn, { backgroundColor: colors.primary }]}
              onPress={openAddModal}
            >
              <Feather name="plus" size={16} color={colors.textInverse} style={{ marginRight: 6 }} />
              <Text style={[styles.createFirstBtnText, { color: colors.textInverse }]}>
                Add Task for Today
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.allDoneBox, { backgroundColor: colors.completedBg }]}>
            <Feather name="smile" size={24} color={colors.completed} />
            <Text style={[styles.allDoneText, { color: colors.completed }]}>
              All pending tasks for today are completed! Great job!
            </Text>
          </View>
        )}

        {/* Completed Tasks Accordion / Section */}
        {completedTasks.length > 0 && (
          <View style={styles.completedSection}>
            <Text style={[styles.completedSectionTitle, { color: colors.textSecondary }]}>
              Completed Today ({completedTasks.length})
            </Text>
            {completedTasks.map((item) => (
              <TaskCard
                key={item.occurrence_id}
                task={item}
                onToggleStatus={toggleTaskStatus}
                onEdit={openEditModal}
                onDelete={deleteTask}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Task Creation / Edit Modal */}
      <AddTaskModal
        visible={modalVisible}
        initialDate={today}
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  quickAddButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 10,
  },
  overdueBannerTextCol: {
    flex: 1,
    marginLeft: 10,
  },
  overdueBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  overdueBannerSub: {
    fontSize: 12,
    marginTop: 1,
    opacity: 0.85,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyBox: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginVertical: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  createFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  createFirstBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  allDoneBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginVertical: 10,
  },
  allDoneText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
  },
  completedSection: {
    marginTop: 18,
  },
  completedSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

