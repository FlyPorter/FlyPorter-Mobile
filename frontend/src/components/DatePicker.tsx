import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  ScrollView,
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
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const yearScrollViewRef = useRef<ScrollView>(null);

  // Reset pickers when calendar modal opens
  useEffect(() => {
    if (showCalendar) {
      setShowYearPicker(false);
      setShowMonthPicker(false);
    }
  }, [showCalendar]);

  // Update current year/month when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      const date = new Date(selectedDate + 'T00:00:00');
      setCurrentYear(date.getFullYear());
      setCurrentMonth(date.getMonth() + 1);
    }
  }, [selectedDate]);

  const handleDateSelect = (day: any) => {
    const dateString = day.dateString; // Format: YYYY-MM-DD
    setSelectedDate(dateString);
    onChange(dateString);
    setShowCalendar(false);
  };

  const handleYearMonthChange = (year: number, month: number) => {
    setCurrentYear(year);
    setCurrentMonth(month);
    setShowYearPicker(false);
    setShowMonthPicker(false);
  };

  // Scroll to current year when year picker opens
  useEffect(() => {
    if (showYearPicker && yearScrollViewRef.current) {
      setTimeout(() => {
        const currentYearIndex = generateYears.findIndex(y => y === currentYear);
        if (currentYearIndex >= 0 && yearScrollViewRef.current) {
          yearScrollViewRef.current.scrollTo({
            y: currentYearIndex * 50, // Approximate item height
            animated: true,
          });
        }
      }, 100);
    }
  }, [showYearPicker, currentYear, generateYears]);

  const getCurrentCalendarDate = () => {
    const year = currentYear;
    const month = String(currentMonth).padStart(2, '0');
    return `${year}-${month}-01`;
  };

  // Generate years list (current year ± 10 years)
  const generateYears = React.useMemo(() => {
    const currentYearNum = new Date().getFullYear();
    const years = [];
    for (let i = currentYearNum - 10; i <= currentYearNum + 10; i++) {
      years.push(i);
    }
    return years;
  }, []);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

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

            {/* Year Picker */}
            {showYearPicker && (
              <View style={styles.pickerContainer}>
                <ScrollView
                  ref={yearScrollViewRef}
                  style={styles.pickerScrollView}
                  contentContainerStyle={styles.pickerScrollContent}
                >
                  {generateYears.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.pickerItem,
                        year === currentYear && styles.pickerItemSelected,
                      ]}
                      onPress={() => handleYearMonthChange(year, currentMonth)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          year === currentYear && styles.pickerItemTextSelected,
                        ]}
                      >
                        {year}
                      </Text>
                      {year === currentYear && (
                        <Ionicons name="checkmark" size={20} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Month Picker */}
            {showMonthPicker && (
              <View style={styles.pickerContainer}>
                <ScrollView style={styles.pickerScrollView}>
                  {months.map((month, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.pickerItem,
                        index + 1 === currentMonth && styles.pickerItemSelected,
                      ]}
                      onPress={() => handleYearMonthChange(currentYear, index + 1)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          index + 1 === currentMonth && styles.pickerItemTextSelected,
                        ]}
                      >
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {!showYearPicker && !showMonthPicker && (
              <Calendar
                current={getCurrentCalendarDate()}
                onDayPress={handleDateSelect}
                markedDates={markedDates}
                minDate={minimumDate}
                maxDate={maximumDate}
                enableSwipeMonths={true}
                hideExtraDays={true}
                firstDay={1}
                showWeekNumbers={false}
                onMonthChange={(month: any) => {
                  const date = new Date(month.dateString);
                  setCurrentYear(date.getFullYear());
                  setCurrentMonth(date.getMonth() + 1);
                }}
                renderHeader={(date: any) => {
                  const year = date.getFullYear();
                  const month = date.getMonth();
                  return (
                    <View style={styles.calendarHeader}>
                      <TouchableOpacity
                        style={styles.calendarHeaderButton}
                        onPress={() => {
                          setShowMonthPicker(false);
                          setShowYearPicker(true);
                        }}
                      >
                        <Text style={styles.calendarHeaderText}>
                          {months[month]} {year}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  );
                }}
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
            )}
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
  yearMonthSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  yearMonthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  yearMonthText: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
  },
  pickerContainer: {
    maxHeight: 200,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerScrollView: {
    maxHeight: 200,
  },
  pickerScrollContent: {
    paddingBottom: spacing.md,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  calendarHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    gap: spacing.xs,
  },
  calendarHeaderText: {
    ...typography.h4,
    fontWeight: '600',
    color: colors.text,
  },
  pickerItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerItemSelected: {
    backgroundColor: colors.primary + '20',
  },
  pickerItemText: {
    ...typography.body1,
    color: colors.text,
  },
  pickerItemTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
});

