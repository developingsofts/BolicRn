import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BasicTopBar from '../components/BasicTopBar';
import { COLORS, DIMENSIONS } from '../config/constants';

interface DayAvailability {
  startTime: string;
  endTime: string;
  isOff: boolean;
}

interface WeekAvailability {
  [key: string]: DayAvailability;
}

const daysOfWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const defaultAvailability: WeekAvailability = {
  Monday: { startTime: '09:00', endTime: '17:00', isOff: false },
  Tuesday: { startTime: '09:00', endTime: '17:00', isOff: false },
  Wednesday: { startTime: '09:00', endTime: '17:00', isOff: false },
  Thursday: { startTime: '09:00', endTime: '17:00', isOff: false },
  Friday: { startTime: '09:00', endTime: '17:00', isOff: false },
  Saturday: { startTime: '09:00', endTime: '17:00', isOff: true },
};

const TrainerAvailability: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [availability, setAvailability] = useState<WeekAvailability>(defaultAvailability);
  const [initialAvailability] = useState(defaultAvailability);

  const handleStartTimeChange = (day: string, time: string) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: { ...prev[day], startTime: time },
    }));
  };

  const handleEndTimeChange = (day: string, time: string) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: { ...prev[day], endTime: time },
    }));
  };

  const handleToggleOff = (day: string) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: { ...prev[day], isOff: !prev[day].isOff },
    }));
  };

  const handleDiscard = () => {
    setAvailability(initialAvailability);
    Alert.alert('Changes discarded');
  };

  const handleUpdate = () => {
    Alert.alert('Availability updated successfully!');
  };

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <BasicTopBar
        onBackPress={() => navigation.goBack()}
        title="My Availability"
        subtitle="Manage your availability"
        containerStyle={{ paddingTop: DIMENSIONS.spacing.xxl, paddingBottom: DIMENSIONS.spacing.lg }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.sessionCard}>
          {daysOfWeek.map((day, idx) => (
            <View key={day} style={styles.scheduleRow}>
              <Text style={styles.dayText}>{day}</Text>
              <View style={styles.timeRow}>
                {availability[day].isOff ? (
                  <>
                    <View style={styles.badgeOff}><Text style={styles.badgeText}>OFF</Text></View>
                    <Text style={styles.dash}>-</Text>
                    <View style={styles.badgeOff}><Text style={styles.badgeText}>OFF</Text></View>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={{
                        borderWidth: 0.5,
                        borderColor: '#0000001F',
                        paddingHorizontal: 12,
                        paddingVertical: 9,
                        borderRadius: 32,
                      }}
                      onPress={() => Alert.alert('Select start time')}
                    >
                      <Text style={styles.timeText}>{availability[day].startTime}</Text>
                    </TouchableOpacity>
                    <Text style={styles.dash}>-</Text>
                    <TouchableOpacity
                      style={{
                        borderWidth: 0.5,
                        borderColor: '#0000001F',
                        paddingHorizontal: 12,
                        paddingVertical: 9,
                        borderRadius: 32,
                      }}
                      onPress={() => Alert.alert('Select end time')}
                    >
                      <Text style={styles.timeText}>{availability[day].endTime}</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.discardBtn]} onPress={handleDiscard}>
            <Text style={styles.discardText}>Discard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.updateBtn]} onPress={handleUpdate}>
            <Text style={styles.updateText}>Update</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  offTimeBox: {
    backgroundColor: '#E6E6E6',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  offTimeText: {
    color: '#DA9393',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
  },
  offBadgeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offBadge: {
    backgroundColor: COLORS.error,
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 15,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    textAlign: 'center',
    minWidth: 70,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // ...existing code...
  scrollContent: {
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  sessionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#EDEDED",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    minWidth: 100,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '60%',
  },
  badgeOff: {
    backgroundColor: '#E6E6E6',
    borderRadius: 32,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  badgeText: {
    color: "#DA9393",
    fontSize: 15,
  },
  dash: {
    color: COLORS.textSecondary,
    marginHorizontal: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 10,
    flexWrap: 'wrap',
    width: '100%',
    justifyContent: 'space-between',
  },
  satSunOffRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  satSunOffText: {
    fontSize: 15,
    color: COLORS.error,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  toggleBtn: {
    minWidth: 120,
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 15,
  },
  dayLabel: {
    width: 90,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  timeBtn: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeText: {
    fontSize: 15,
    color: COLORS.text,
  },
  toText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginHorizontal: 2,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  offBtn: {
    marginLeft: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: COLORS._E2E2E2,
  },
  offActive: {
    backgroundColor: COLORS.error,
  },
  offText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  offTextActive: {
    color: COLORS.white,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', 
    gap: 16,
  },
  actionBtn: {
    borderRadius: 8,
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  discardBtn: {
    backgroundColor: COLORS.surface,
  },
  updateBtn: {
    backgroundColor: COLORS.primary,
  },
  discardText: {
    color: COLORS.error,
    fontWeight: '600',
    fontSize: 16,
  },
  updateText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default TrainerAvailability;
