/**
 * Tasks Screen
 * Comprehensive task management with filters, category pills, search bar, sorting, and CRUD actions
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
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
import { CATEGORIES } from '../constants/categories';
import { getTodayDateString } from '../utils/dateUtils';
import { AddTaskModal } from './AddTaskScreen';

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'pending', label: 'Pending' },
  { id: 'completed', label: 'Completed' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'upcoming', label: 'Upcoming' },
];

const SORT_OPTIONS = [
  { id: 'time', label: 'Time' },
  { id: 'priority', label: 'Priority' },
  { id: 'created', label: 'Recent' },
];

export const TasksScreen = ({ route }) => {
  const { colors, isDark } = useTheme();
  const initialFilter = route?.params?.initialFilter || 'all';

  const {
    tasks,
    loading,
    filter,
    setFilter,
    categoryFilter,
    setCategoryFilter,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    refreshTasks,
    toggleTaskStatus,
    deleteTask,
  } = useTasks(getTodayDateString());

  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Set initial filter if passed from navigation params
  useFocusEffect(
    useCallback(() => {
      if (route?.params?.initialFilter) {
        setFilter(route.params.initialFilter);
      }
      refreshTasks();
    }, [route?.params?.initialFilter, refreshTasks])
  );

  const openAddModal = () => {
    setEditingTask(null);
    setModalVisible(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Screen Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Task Manager</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={openAddModal}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={18} color={colors.textInverse} />
          <Text style={[styles.addButtonText, { color: colors.textInverse }]}>Add Task</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder },
          ]}
        >
          <Feather name="search" size={17} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search by title or description..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter Tabs (Horizontal Scroll) */}
      <View style={styles.tabsWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTER_TABS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.tabsContainer}
          renderItem={({ item }) => {
            const isSelected = filter === item.id;
            return (
              <TouchableOpacity
                style={[
                  styles.filterTab,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surfaceSecondary,
                    borderColor: isSelected ? colors.primary : colors.cardBorder,
                  },
                ]}
                onPress={() => setFilter(item.id)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    { color: isSelected ? colors.textInverse : colors.textSecondary },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Category Pills & Sorting Bar */}
      <View style={styles.subFilterBar}>
        {/* Category Pills */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 'All', name: 'All Categories' }, ...CATEGORIES]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoryPills}
          renderItem={({ item }) => {
            const isSelected = categoryFilter === item.id;
            return (
              <TouchableOpacity
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isSelected
                      ? colors.accent
                      : colors.surface,
                    borderColor: isSelected ? colors.accent : colors.cardBorder,
                  },
                ]}
                onPress={() => setCategoryFilter(item.id)}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        {/* Sort Trigger Button */}
        <View style={styles.sortContainer}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              style={[
                styles.sortButton,
                sortBy === opt.id && { backgroundColor: colors.surfaceSecondary },
              ]}
              onPress={() => setSortBy(opt.id)}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  {
                    color: sortBy === opt.id ? colors.primary : colors.textMuted,
                    fontWeight: sortBy === opt.id ? '700' : '500',
                  },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tasks List */}
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
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onToggleStatus={toggleTaskStatus}
            onEdit={openEditModal}
            onDelete={deleteTask}
          />
        )}
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Feather name="inbox" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No tasks match your filter</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {searchQuery
                ? `No tasks found matching "${searchQuery}".`
                : 'You have no tasks matching this criteria. Try changing filters or create a new task.'}
            </Text>
            <TouchableOpacity
              style={[styles.emptyAddBtn, { backgroundColor: colors.primary }]}
              onPress={openAddModal}
            >
              <Feather name="plus" size={16} color={colors.textInverse} style={{ marginRight: 6 }} />
              <Text style={[styles.emptyAddBtnText, { color: colors.textInverse }]}>Create New Task</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Add / Edit Task Modal */}
      <AddTaskModal
        visible={modalVisible}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginVertical: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  tabsWrapper: {
    marginVertical: 6,
  },
  tabsContainer: {
    paddingHorizontal: 20,
  },
  filterTab: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subFilterBar: {
    paddingHorizontal: 20,
    marginVertical: 4,
    flexDirection: 'column',
  },
  categoryPills: {
    paddingVertical: 4,
  },
  categoryPill: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 6,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  sortButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginLeft: 4,
  },
  sortButtonText: {
    fontSize: 11,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  emptyContainer: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
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
    marginBottom: 20,
    lineHeight: 18,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  emptyAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

