import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BasicTopBar from '../components/BasicTopBar';
import DateTimeSelector from '../components/DateTimeSelector';
import { COLORS, DIMENSIONS } from '../config/constants';

interface DaySlots {
  date: string;
  displayDate: string;
  day: string;
  slots: string[];
}

const RescheduleSessionScreen = ({ navigation }: any) => {
  // Create custom day slots matching the original hardcoded data
  const customDaySlots: DaySlots[] = [
    {
      date: '2025-10-14',
      displayDate: '14',
      day: 'Sun',
      slots: ['9:00 AM', '2:00 PM', '7:00 PM'],
    },
    {
      date: '2025-10-15',
      displayDate: '15',
      day: 'Mon',
      slots: ['9:00 AM', '2:00 PM', '7:00 PM'],
    },
    {
      date: '2025-10-16',
      displayDate: '16',
      day: 'Tue',
      slots: ['9:00 AM', '2:00 PM', '7:00 PM'],
    },
  ];

  const handleUpdate = (selectedDate: string, selectedTime: string) => {
    // Replace with your toast/alert logic
    alert(`Your session has been rescheduled to ${selectedDate} at ${selectedTime}`);
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
      <DateTimeSelector
        navigation={navigation}
        buttonText="Update"
        onButtonPress={handleUpdate}
        customDaySlots={customDaySlots}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});

export default RescheduleSessionScreen;
