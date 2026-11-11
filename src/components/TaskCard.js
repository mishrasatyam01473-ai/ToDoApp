/**
 * TaskCard Component
 * Displays a single task occurrence with custom checkbox, category badge, priority tag, and actions
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getCategoryMeta } from '../constants/categories';
import { formatTimeDisplay } from '../utils/dateUtils';

export const TaskCard = ({
  task,
  onToggleStatus,
  onEdit,
  onDelete,
}) => {
  const { colors, isDark } = useTheme();
  const isCompleted = task.status === 'completed';
  const categoryMeta = getCategoryMeta(task.category);

  // Priority color mapping
  const getPriorityColors = () => {
    switch (task.priority) {
      case 'High':
        return { text: colors.priorityHigh, bg: colors.priorityHighBg };
      case 'Medium':
        return { text: colors.priorityMedium, bg: colors.priorityMediumBg };
      case 'Low':
      default:
        return { text: colors.priorityLow, bg: colors.priorityLowBg };
    }
  };

  const priorityColor = getPriorityColors();

  const confirmDelete = () => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${task.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(task.task_id) },
      ]
    );
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isCompleted ? colors.completedBg : colors.cardBorder,
        },
        isCompleted && styles.completedCard,
      ]}
    >
      <View style={styles.contentRow}>
        {/* Custom Toggle Checkbox */}
        <TouchableOpacity
          style={[
            styles.checkbox,
            {
              borderColor: isCompleted ? colors.completed : colors.cardBorder,
              backgroundColor: isCompleted ? colors.completed : 'transparent',
            },
          ]}
          onPress={() => onToggleStatus(task.occurrence_id, task.status)}
          activeOpacity={0.7}
        >
          {isCompleted && <Feather name="check" size={15} color="#FFFFFF" />}
        </TouchableOpacity>

        {/* Task Details */}
        <View style={styles.infoCol}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                { color: isCompleted ? colors.textMuted : colors.textPrimary },
                isCompleted && styles.completedTitle,
              ]}
              numberOfLines={2}
            >
              {task.title}
            </Text>
          </View>

          {task.description ? (
            <Text
              style={[
                styles.description,
                { color: isCompleted ? colors.textMuted : colors.textSecondary },
              ]}
              numberOfLines={2}
            >
              {task.description}
            </Text>
          ) : null}

          {/* Meta Tags Row */}
          <View style={styles.tagRow}>
            {/* Category Tag */}
            <View
              style={[
                styles.tag,
                {
                  backgroundColor: isDark ? categoryMeta.bgDark : categoryMeta.bgLight,
                },
              ]}
            >
              <Feather name={categoryMeta.icon} size={11} color={categoryMeta.color} />
              <Text style={[styles.tagText, { color: categoryMeta.color }]}>
                {task.category}
              </Text>
            </View>

            {/* Priority Tag */}
            <View style={[styles.tag, { backgroundColor: priorityColor.bg }]}>
              <Text style={[styles.tagText, { color: priorityColor.text, fontWeight: '700' }]}>
                {task.priority}
              </Text>
            </View>

            {/* Time */}
            <View style={styles.timeTag}>
              <Feather name="clock" size={11} color={colors.textMuted} />
              <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                {formatTimeDisplay(task.scheduled_time)}
              </Text>
            </View>

            {/* Recurring Indicator */}
            {task.repeat_option && task.repeat_option !== 'none' && (
              <View style={styles.recurringTag}>
                <Feather name="repeat" size={11} color={colors.primary} />
              </View>
            )}

            {/* Overdue Warning */}
            {task.isOverdue && !isCompleted && (
              <View style={[styles.tag, { backgroundColor: colors.overdueBg }]}>
                <Text style={[styles.tagText, { color: colors.overdue, fontWeight: '700' }]}>
                  Overdue
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons (Edit / Delete) */}
        <View style={styles.actionCol}>
          {onEdit && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onEdit(task)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="edit-2" size={15} color={colors.textMuted} />
            </TouchableOpacity>
          )}

          {onDelete && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={confirmDelete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="trash-2" size={15} color={colors.priorityHigh} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginVertical: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  completedCard: {
    opacity: 0.85,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginRight: 12,
  },
  infoCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
  },
  description: {
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 4,
  },
  recurringTag: {
    marginRight: 6,
    marginBottom: 4,
  },
  actionCol: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
  },
  actionButton: {
    padding: 6,
    marginLeft: 2,
  },
});

