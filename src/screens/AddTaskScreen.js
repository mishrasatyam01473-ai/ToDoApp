/**
 * Add / Edit Task Modal & Screen
 * Handles task creation and edits with validation, category picker, priority, date/time, and repeat patterns
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { createTask, updateTask } from '../services/taskService';
import { CATEGORIES } from '../constants/categories';
import { CONFIG } from '../constants/config';
import { getTodayDateString, addDays } from '../utils/dateUtils';
import { validateTask } from '../utils/validation';

export const AddTaskModal = ({
  visible,
  onClose,
  onSaved,
  initialDate,
  editingTask = null,
}) => {
  const { colors, isDark } = useTheme();

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Personal');
  const [priority, setPriority] = useState('Medium');
  const [scheduledDate, setScheduledDate] = useState(initialDate || getTodayDateString());
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [repeatOption, setRepeatOption] = useState('none');
  const [selectedCustomDays, setSelectedCustomDays] = useState([1, 2, 3, 4, 5]); // Default Mon-Fri
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Time Picker Helpers (Hour & Minute Selector)
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('AM');

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title || '');
      setDescription(editingTask.description || '');
      setCategory(editingTask.category || 'Personal');
      setPriority(editingTask.priority || 'Medium');
      setScheduledDate(editingTask.scheduled_date || getTodayDateString());
      setScheduledTime(editingTask.scheduled_time || '09:00');
      setRepeatOption(editingTask.repeat_option || 'none');
      setNotificationEnabled(editingTask.notification_enabled !== 0);

      if (editingTask.repeat_days) {
        try {
          const days = JSON.parse(editingTask.repeat_days);
          if (Array.isArray(days)) setSelectedCustomDays(days);
        } catch (e) {}
      }

      // Parse time
      if (editingTask.scheduled_time) {
        const [h, m] = editingTask.scheduled_time.split(':').map(Number);
        const period = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        setSelectedHour(displayH);
        setSelectedMinute(m || 0);
        setSelectedPeriod(period);
      }
    } else {
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('Personal');
      setPriority('Medium');
      setScheduledDate(initialDate || getTodayDateString());
      setScheduledTime('09:00');
      setSelectedHour(9);
      setSelectedMinute(0);
      setSelectedPeriod('AM');
      setRepeatOption('none');
      setSelectedCustomDays([1, 2, 3, 4, 5]);
      setNotificationEnabled(true);
      setErrors({});
    }
  }, [editingTask, visible, initialDate]);

  // Update 24hr string whenever hour/min/period changes
  const updateScheduledTime = (hour, min, period) => {
    let h = hour % 12;
    if (period === 'PM') h += 12;
    const formatted = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    setScheduledTime(formatted);
  };

  const handleSave = async () => {
    const payload = {
      title,
      description,
      category,
      priority,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
      repeat_option: repeatOption,
      repeat_days: repeatOption === 'custom' ? selectedCustomDays : null,
      notification_enabled: notificationEnabled,
    };

    const validation = validateTask(payload);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingTask) {
        await updateTask(editingTask.task_id || editingTask.id, payload);
      } else {
        await createTask(payload);
      }
      onSaved();
    } catch (error) {
      console.error('Error saving task:', error);
      Alert.alert('Error', 'Failed to save task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCustomDay = (dayId) => {
    if (selectedCustomDays.includes(dayId)) {
      if (selectedCustomDays.length === 1) {
        Alert.alert('Custom Schedule', 'Please select at least one day.');
        return;
      }
      setSelectedCustomDays(selectedCustomDays.filter((d) => d !== dayId));
    } else {
      setSelectedCustomDays([...selectedCustomDays, dayId]);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={22} color={colors.textSecondary} />
            </TouchableOpacity>

            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </Text>

            <TouchableOpacity
              onPress={handleSave}
              disabled={isSubmitting}
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.saveBtnText, { color: colors.textInverse }]}>
                {editingTask ? 'Update' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Title Input */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                Task Title <Text style={{ color: colors.priorityHigh }}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    color: colors.textPrimary,
                    borderColor: errors.title ? colors.priorityHigh : colors.cardBorder,
                  },
                ]}
                placeholder="e.g., Morning workout & stretch"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  if (errors.title) setErrors({ ...errors, title: null });
                }}
              />
              {errors.title && <Text style={styles.errorHint}>{errors.title}</Text>}
            </View>

            {/* Description Input */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Description (Optional)</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    color: colors.textPrimary,
                    borderColor: colors.cardBorder,
                  },
                ]}
                placeholder="Add extra context, notes, or sub-goals..."
                placeholderTextColor={colors.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Category Selector */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor: isSelected
                            ? cat.color
                            : isDark
                            ? '#1F2937'
                            : '#F1F5F9',
                          borderColor: isSelected ? cat.color : colors.cardBorder,
                        },
                      ]}
                      onPress={() => setCategory(cat.id)}
                    >
                      <Feather
                        name={cat.icon}
                        size={13}
                        color={isSelected ? '#FFFFFF' : cat.color}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.categoryChipText,
                          { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Priority Selector */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Priority Level</Text>
              <View style={styles.priorityRow}>
                {CONFIG.PRIORITIES.map((p) => {
                  const isSelected = priority === p.value;
                  return (
                    <TouchableOpacity
                      key={p.value}
                      style={[
                        styles.priorityButton,
                        {
                          backgroundColor: isSelected
                            ? p.color
                            : isDark
                            ? '#1F2937'
                            : '#F1F5F9',
                          borderColor: isSelected ? p.color : colors.cardBorder,
                        },
                      ]}
                      onPress={() => setPriority(p.value)}
                    >
                      <Text
                        style={[
                          styles.priorityText,
                          { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                        ]}
                      >
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Date Selection */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Scheduled Date</Text>
              <View style={styles.dateRow}>
                {[
                  { label: 'Today', date: getTodayDateString() },
                  { label: 'Tomorrow', date: addDays(getTodayDateString(), 1) },
                  { label: 'Next Week', date: addDays(getTodayDateString(), 7) },
                ].map((item) => {
                  const isSelected = scheduledDate === item.date;
                  return (
                    <TouchableOpacity
                      key={item.label}
                      style={[
                        styles.dateChip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surfaceSecondary,
                          borderColor: isSelected ? colors.primary : colors.cardBorder,
                        },
                      ]}
                      onPress={() => setScheduledDate(item.date)}
                    >
                      <Text
                        style={[
                          styles.dateChipText,
                          { color: isSelected ? colors.textInverse : colors.textPrimary },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    color: colors.textPrimary,
                    borderColor: errors.scheduled_date ? colors.priorityHigh : colors.cardBorder,
                    marginTop: 8,
                  },
                ]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                value={scheduledDate}
                onChangeText={setScheduledDate}
              />
            </View>

            {/* Time Selection */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Scheduled Time</Text>
              <View style={styles.timeSelectorRow}>
                {/* Hour */}
                <View style={styles.timePartCol}>
                  <Text style={[styles.timePartLabel, { color: colors.textMuted }]}>Hour</Text>
                  <View style={styles.timeNumberRow}>
                    {[6, 8, 9, 10, 12, 2, 5, 8].map((h) => (
                      <TouchableOpacity
                        key={`h-${h}`}
                        style={[
                          styles.timeBtn,
                          selectedHour === h && { backgroundColor: colors.primary },
                        ]}
                        onPress={() => {
                          setSelectedHour(h);
                          updateScheduledTime(h, selectedMinute, selectedPeriod);
                        }}
                      >
                        <Text
                          style={[
                            styles.timeBtnText,
                            {
                              color: selectedHour === h ? colors.textInverse : colors.textPrimary,
                            },
                          ]}
                        >
                          {h}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Minute & AM/PM */}
                <View style={styles.timePartCol}>
                  <Text style={[styles.timePartLabel, { color: colors.textMuted }]}>Minute & Period</Text>
                  <View style={styles.timeNumberRow}>
                    {[0, 15, 30, 45].map((m) => (
                      <TouchableOpacity
                        key={`m-${m}`}
                        style={[
                          styles.timeBtn,
                          selectedMinute === m && { backgroundColor: colors.primary },
                        ]}
                        onPress={() => {
                          setSelectedMinute(m);
                          updateScheduledTime(selectedHour, m, selectedPeriod);
                        }}
                      >
                        <Text
                          style={[
                            styles.timeBtnText,
                            {
                              color: selectedMinute === m ? colors.textInverse : colors.textPrimary,
                            },
                          ]}
                        >
                          :{String(m).padStart(2, '0')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {['AM', 'PM'].map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={[
                          styles.timeBtn,
                          selectedPeriod === p && { backgroundColor: colors.accent },
                        ]}
                        onPress={() => {
                          setSelectedPeriod(p);
                          updateScheduledTime(selectedHour, selectedMinute, p);
                        }}
                      >
                        <Text
                          style={[
                            styles.timeBtnText,
                            {
                              color: selectedPeriod === p ? colors.textInverse : colors.textPrimary,
                              fontWeight: '700',
                            },
                          ]}
                        >
                          {p}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
              <Text style={[styles.timeSummary, { color: colors.primary }]}>
                Selected Time: {scheduledTime} ({selectedHour}:{String(selectedMinute).padStart(2, '0')} {selectedPeriod})
              </Text>
            </View>

            {/* Recurrence Schedule */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                Recurring Schedule
              </Text>
              <View style={styles.repeatList}>
                {CONFIG.REPEAT_OPTIONS.map((opt) => {
                  const isSelected = repeatOption === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.repeatOptionRow,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? '#134E4A'
                              : '#CCFBF1'
                            : colors.surfaceSecondary,
                          borderColor: isSelected ? colors.primary : colors.cardBorder,
                        },
                      ]}
                      onPress={() => setRepeatOption(opt.value)}
                    >
                      <View style={styles.repeatOptionLeft}>
                        <Feather
                          name={isSelected ? 'check-circle' : 'circle'}
                          size={16}
                          color={isSelected ? colors.primary : colors.textMuted}
                        />
                        <Text
                          style={[
                            styles.repeatOptionText,
                            {
                              color: isSelected ? colors.primary : colors.textPrimary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom Weekdays Picker */}
              {repeatOption === 'custom' && (
                <View style={styles.customDaysContainer}>
                  <Text style={[styles.customDaysTitle, { color: colors.textSecondary }]}>
                    Select repeating weekdays:
                  </Text>
                  <View style={styles.weekdayRow}>
                    {CONFIG.WEEKDAYS.map((day) => {
                      const isDaySelected = selectedCustomDays.includes(day.id);
                      return (
                        <TouchableOpacity
                          key={day.id}
                          style={[
                            styles.weekdayBubble,
                            {
                              backgroundColor: isDaySelected
                                ? colors.primary
                                : colors.surfaceSecondary,
                              borderColor: isDaySelected ? colors.primary : colors.cardBorder,
                            },
                          ]}
                          onPress={() => toggleCustomDay(day.id)}
                        >
                          <Text
                            style={[
                              styles.weekdayBubbleText,
                              {
                                color: isDaySelected
                                  ? colors.textInverse
                                  : colors.textSecondary,
                              },
                            ]}
                          >
                            {day.short}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* Notification Toggle */}
            <View style={[styles.toggleRow, { borderTopColor: colors.divider }]}>
              <View style={styles.toggleTextCol}>
                <Text style={[styles.toggleTitle, { color: colors.textPrimary }]}>
                  Task Notification Reminder
                </Text>
                <Text style={[styles.toggleSub, { color: colors.textSecondary }]}>
                  Schedule offline device alert at {scheduledTime}
                </Text>
              </View>
              <Switch
                value={notificationEnabled}
                onValueChange={setNotificationEnabled}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 6,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  saveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  formScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
  },
  formGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorHint: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 4,
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  priorityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  priorityText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dateChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  dateChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeSelectorRow: {
    flexDirection: 'column',
    marginTop: 4,
  },
  timePartCol: {
    marginBottom: 8,
  },
  timePartLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  timeNumberRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  timeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.2)',
  },
  timeBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeSummary: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  repeatList: {
    marginTop: 4,
  },
  repeatOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  repeatOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  repeatOptionText: {
    fontSize: 13,
    marginLeft: 10,
  },
  customDaysContainer: {
    marginTop: 6,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(150, 150, 150, 0.08)',
  },
  customDaysTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekdayBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayBubbleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 1,
  },
  toggleTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  toggleSub: {
    fontSize: 12,
    marginTop: 2,
  },
});

