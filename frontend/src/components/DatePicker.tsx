import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme/theme';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  label?: string;
  minimumDate?: string; // YYYY-MM-DD format
  maximumDate?: string; // YYYY-MM-DD format
  style?: any;
  compact?: boolean;
}

export default function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  label,
  minimumDate,
  maximumDate,
  style,
  compact = false,
}: DatePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value);

  const handleDateSelect = (day: any) => {
    const dateString = day.dateString; // Format: YYYY-MM-DD
    setSelectedDate(dateString);
    onChange(dateString);
    setShowCalendar(false);
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString + 'T00:00:00');
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const markedDates = selectedDate
    ? {
        [selectedDate]: {
          selected: true,
          selectedColor: colors.primary,
          selectedTextColor: '#fff',
        },
      }
    : {};

  return (
    <View style={style}>
      {label && !compact && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.dateInput, compact && styles.compactDateInput]}
        onPress={() => setShowCalendar(true)}
      >
        {!compact && (
          <View style={styles.dateInputContent}>
            <Ionicons name="calendar" size={20} color={colors.primary} />
            <Text
              style={[
                styles.dateText,
                !selectedDate && styles.placeholderText,
              ]}
            >
              {selectedDate ? formatDisplayDate(selectedDate) : placeholder}
            </Text>
          </View>
        )}
        {compact && (
          <Text
            style={[
              styles.compactDateText,
              !selectedDate && styles.placeholderText,
            ]}
          >
            {selectedDate ? formatDisplayDate(selectedDate) : placeholder}
          </Text>
        )}
        {!compact && (
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        )}
      </TouchableOpacity>

      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity
                onPress={() => setShowCalendar(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Calendar
              current={selectedDate || new Date().toISOString().split('T')[0]}
              onDayPress={handleDateSelect}
              markedDates={markedDates}
              minDate={minimumDate}
              maxDate={maximumDate}
              theme={{
                todayTextColor: colors.primary,
                arrowColor: colors.primary,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: '#fff',
                textDayFontWeight: '500',
                textMonthFontWeight: '600',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
              }}
              style={styles.calendar}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  compactDateInput: {
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
  },
  compactDateText: {
    ...typography.body2,
    color: colors.text,
  },
  dateInputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  dateText: {
    ...typography.body1,
    color: colors.text,
    flex: 1,
  },
  placeholderText: {
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h4,
    color: colors.text,
  },
  closeButton: {
    padding: spacing.xs,
  },
  calendar: {
    borderRadius: 10,
    padding: spacing.md,
  },
});

