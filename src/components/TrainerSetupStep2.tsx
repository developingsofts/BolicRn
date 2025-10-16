import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, DIMENSIONS } from '../config/constants';
import FontWeight from '../hooks/useInterFonts';

interface TrainerSetupStep2Props {
  onSaveDraft: () => void;
  onConfirm: () => void;
}

const schedule = [
  { day: 'Monday', start: '9:00 PM', end: '5:00 PM', off: false },
  { day: 'Tuesday', start: '9:00 PM', end: '5:00 PM', off: false },
  { day: 'Wednesday', start: '9:00 PM', end: '5:00 PM', off: false },
  { day: 'Thursday', start: '9:00 PM', end: '5:00 PM', off: false },
  { day: 'Friday', start: '9:00 PM', end: '5:00 PM', off: false },
  { day: 'Saturday', start: '9:00 PM', end: '5:00 PM', off: false },
  { day: 'Sunday', start: 'OFF', end: 'OFF', off: true },
];

const TrainerSetupStep2: React.FC<TrainerSetupStep2Props> = ({ onSaveDraft, onConfirm }) => {
  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <View style={{ marginBottom: 16 }}>
        <Text style={styles.sectionTitle}>Define Your Availability</Text>
        <Text style={styles.sectionDesc}>
          Set your standard weekly hours. You can always adjust this and block off specific dates later.
        </Text>
      </View>
      <View style={styles.sessionCard}>
        {schedule.map((slot, index) => (
          <View key={index} style={styles.scheduleRow}>
            <Text style={styles.dayText}>{slot.day}</Text>
            <View style={styles.timeRow}>
              {slot.off ? (
                <>
                  <View style={styles.badgeOff}><Text style={styles.badgeText}>OFF</Text></View>
                  <Text style={styles.dash}>-</Text>
                  <View style={styles.badgeOff}><Text style={styles.badgeText}>OFF</Text></View>
                </>
              ) : (
                <>
                  <Text style={styles.timeText}>{slot.start}</Text>
                  <Text style={styles.dash}>-</Text>
                  <Text style={styles.timeText}>{slot.end}</Text>
                </>
              )}
            </View>
          </View>
        ))}
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.actionBtn, styles.outlineBtn]} onPress={onSaveDraft}>
          <Text style={[styles.actionBtnText, styles.outlineBtnText]}>Save Draft</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onConfirm}>
          <Text style={styles.actionBtnText}>Confirm & Go Live</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
    marginBottom: 2,
  },
  sectionDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  sessionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dayText: {
    fontSize: 15,
    fontFamily: FontWeight.Medium,
    color: COLORS.text,
    minWidth: 100,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeOff: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  badgeText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  dash: {
    color: COLORS.textSecondary,
    marginHorizontal: 6,
  },
  timeText: {
    fontSize: 15,
    fontFamily: FontWeight.Medium,
    color: COLORS.text,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    marginBottom: 30,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: FontWeight.Medium,
  },
  outlineBtn: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  outlineBtnText: {
    color: COLORS.primary,
  },
});

export default TrainerSetupStep2;
