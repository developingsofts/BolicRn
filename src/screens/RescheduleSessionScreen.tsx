import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BasicTopBar from '../components/BasicTopBar';
import { COLORS, DIMENSIONS } from '../config/constants';
import FontWeight from '../hooks/useInterFonts';
import { Calendar } from 'react-native-calendars';

const availableDays = [
  { day: 14, label: 'Sun' },
  { day: 15, label: 'Mon' },
  { day: 16, label: 'Tue' },
];
const availableTimes = ['9:00 AM', '2:00 PM', '7:00 PM'];

const RescheduleSessionScreen = ({ navigation }: any) => {
  const [date, setDate] = useState(new Date(2025, 9, 11));
  const [selectedDay, setSelectedDay] = useState(14);
  const [selectedTime, setSelectedTime] = useState('9:00 AM');

  const handleUpdate = () => {
    // Replace with your toast/alert logic
    alert(`Your session has been rescheduled to ${selectedDay} at ${selectedTime}`);
    navigation.goBack?.();
  };

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <BasicTopBar
        onBackPress={() => navigation.goBack?.()}
        title="Reschedule Session"
        subtitle="You can reschedule before last day."
        containerStyle={{ paddingTop: DIMENSIONS.spacing.xxl, paddingBottom: DIMENSIONS.spacing.lg }}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Calendar Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>October</Text>
            <Text style={styles.selectedDate}>{date.toDateString()}</Text>
          </View>
          <View style={styles.calendarContainer}>
            <Calendar
              current={date.toISOString().split('T')[0]}
              onDayPress={day => setDate(new Date(day.year, day.month - 1, day.day))}
              markedDates={{
                [`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`]: { selected: true }
              }}
              theme={{
                backgroundColor: COLORS.card,
                calendarBackground: COLORS.card,
                textSectionTitleColor: COLORS.textSecondary,
                selectedDayBackgroundColor: COLORS.primary,
                selectedDayTextColor: COLORS.white,
                todayTextColor: COLORS.primary,
                dayTextColor: COLORS.text,
                textDisabledColor: COLORS.border,
                arrowColor: COLORS.primary,
                monthTextColor: COLORS.text,
                indicatorColor: COLORS.primary,
              }}
              style={{ borderRadius: 12, width: '100%' }}
            />
          </View>
        </View>
        {/* Available Slots */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Available Slots</Text>
            <TouchableOpacity>
              <Text style={styles.firstAvailable}>First Available</Text>
            </TouchableOpacity>
          </View>
          {/* Date Selection */}
          <View style={styles.dayRow}>
            {availableDays.map((item) => (
              <TouchableOpacity
                key={item.day}
                style={[styles.dayButton, selectedDay === item.day && styles.dayButtonActive]}
                onPress={() => setSelectedDay(item.day)}
              >
                <Text style={styles.dayNumber}>{item.day}</Text>
                <Text style={styles.dayLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Time Selection */}
          <View style={styles.timeRow}>
            {availableTimes.map((time) => (
              <TouchableOpacity
                key={time}
                style={[styles.timeButton, selectedTime === time && styles.timeButtonActive]}
                onPress={() => setSelectedTime(time)}
              >
                <Text style={styles.timeText}>{time}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {/* Session Details */}
        <View style={styles.sessionCard}>
          <Text style={styles.sessionTitle}>Single Session</Text>
          <Text style={styles.sessionDesc}>One-on-one personalized training session.</Text>
          <View style={styles.sessionDetailsRow}>
            <Text style={styles.sessionPriceDesc}>$75/hr x 4 hours</Text>
            <Text style={styles.sessionPrice}>$300</Text>
          </View>
        </View>
        {/* Update Button */}
        <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
          <Text style={styles.updateButtonText}>Update</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: DIMENSIONS.spacing.lg,
  },
  section: {
    marginTop:20,
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  selectedDate: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  calendarContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  firstAvailable: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  dayRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dayButton: {
    flex: 1,
    backgroundColor: COLORS._E2E2E2,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: COLORS.primary,
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  dayLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeButton: {
    flex: 1,
    backgroundColor: COLORS._E2E2E2,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  timeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  sessionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    marginBottom: 24,
  },
  sessionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  sessionDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  sessionDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionPriceDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  sessionPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
  },
  updateButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 24,
  },
  updateButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default RescheduleSessionScreen;
