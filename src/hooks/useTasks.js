/**
 * Task Management Custom Hook
 * Encapsulates state, filtering, sorting, and live updates
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getTasksForDate,
  getDashboardStatsForDate,
  toggleTaskOccurrenceStatus,
  deleteTask,
  getOverdueTasks,
} from '../services/taskService';
import { getTodayDateString, isFutureDate } from '../utils/dateUtils';

export const useTasks = (initialDate = getTodayDateString()) => {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    completionRate: 0,
    date: initialDate,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'completed', 'overdue', 'today', 'upcoming'
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('time'); // 'time', 'priority', 'created'
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const today = getTodayDateString();

      // If filter is 'overdue', fetch overdue tasks directly
      if (filter === 'overdue') {
        const overdueList = await getOverdueTasks();
        setTasks(overdueList);
      } else {
        const dateToFetch = filter === 'today' ? today : selectedDate;
        const taskList = await getTasksForDate(dateToFetch);
        setTasks(taskList);
      }

      // Always fetch stats for the active view date
      const dashboardStats = await getDashboardStatsForDate(selectedDate);
      setStats(dashboardStats);
    } catch (error) {
      console.error('Error loading task data in useTasks:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, filter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Status toggle handler
  const handleToggleStatus = async (occurrenceId, currentStatus) => {
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => {
          if (t.occurrence_id === occurrenceId) {
            const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
            return { ...t, status: nextStatus };
          }
          return t;
        })
      );

      await toggleTaskOccurrenceStatus(occurrenceId, currentStatus);
      // Refresh stats
      const dashboardStats = await getDashboardStatsForDate(selectedDate);
      setStats(dashboardStats);
    } catch (error) {
      console.error('Failed to toggle task status:', error);
      loadData(); // Revert on failure
    }
  };

  // Delete task handler
  const handleDeleteTask = async (taskId) => {
    try {
      setTasks((prev) => prev.filter((t) => t.task_id !== taskId));
      await deleteTask(taskId);
      const dashboardStats = await getDashboardStatsForDate(selectedDate);
      setStats(dashboardStats);
    } catch (error) {
      console.error('Failed to delete task:', error);
      loadData();
    }
  };

  // Filter and sort items in memory for instant responsiveness
  const processedTasks = tasks
    .filter((task) => {
      // Status filter
      if (filter === 'pending' && task.status !== 'pending') return false;
      if (filter === 'completed' && task.status !== 'completed') return false;
      if (filter === 'upcoming' && !isFutureDate(task.occurrence_date)) return false;

      // Category filter
      if (categoryFilter !== 'All' && task.category !== categoryFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = (task.title || '').toLowerCase().includes(query);
        const matchDesc = (task.description || '').toLowerCase().includes(query);
        if (!matchTitle && !matchDesc) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'time') {
        return (a.scheduled_time || '').localeCompare(b.scheduled_time || '');
      }
      if (sortBy === 'priority') {
        const priorityWeight = { High: 3, Medium: 2, Low: 1 };
        return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      }
      if (sortBy === 'created') {
        return (b.created_at || '').localeCompare(a.created_at || '');
      }
      return 0;
    });

  return {
    tasks: processedTasks,
    rawTasks: tasks,
    stats,
    loading,
    selectedDate,
    setSelectedDate,
    filter,
    setFilter,
    categoryFilter,
    setCategoryFilter,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    refreshTasks: loadData,
    toggleTaskStatus: handleToggleStatus,
    deleteTask: handleDeleteTask,
  };
};

