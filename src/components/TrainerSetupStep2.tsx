import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, DIMENSIONS } from '../config/constants';
import FontWeight from '../hooks/useInterFonts';

interface TrainerSetupStep2Props {
  onSaveDraft: () => void;
  onConfirm: () => void;
}


const defaultSchedule = [
  { day: 'Monday', start: '09:00', end: '17:00', off: false },
  { day: 'Tuesday', start: '09:00', end: '17:00', off: false },
  { day: 'Wednesday', start: '09:00', end: '17:00', off: false },
  { day: 'Thursday', start: '09:00', end: '17:00', off: false },
  { day: 'Friday', start: '09:00', end: '17:00', off: false },
  { day: 'Saturday', start: '09:00', end: '17:00', off: false },
  { day: 'Sunday', start: 'OFF', end: 'OFF', off: true },
];

const TrainerSetupStep2: React.FC<TrainerSetupStep2Props> = ({ onSaveDraft, onConfirm }) => {
  const [schedule, setSchedule] = useState(defaultSchedule);
  const [picker, setPicker] = useState<{visible: boolean; mode: 'start'|'end'; dayIdx: number}|null>(null);
  const [pickerValue, setPickerValue] = useState<Date>(new Date());

  // Helper to format time as HH:mm
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Open picker for a slot
  const openPicker = (dayIdx: number, mode: 'start'|'end') => {
    const timeStr = schedule[dayIdx][mode];
    let [h, m] = timeStr.split(':');
    const date = new Date();
    date.setHours(Number(h) || 9, Number(m) || 0, 0, 0);
    setPickerValue(date);
    setPicker({ visible: true, mode, dayIdx });
  };

  // Handle picker change
  const onTimeChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setPicker(null); 
      return;
    }
    if (selectedDate && picker) {
      const newTime = formatTime(selectedDate);
      setSchedule(prev => prev.map((slot, idx) =>
        idx === picker.dayIdx ? { ...slot, [picker.mode]: newTime } : slot
      ));
    }
    setPicker(null);
  };

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
                  <TouchableOpacity
                    style={{
                      borderWidth: 0.5,
                      borderColor: '#0000001F',
                      paddingHorizontal: 12,
                      paddingVertical: 9,
                      borderRadius: 32,
                    }}
                    onPress={() => openPicker(index, 'start')}
                  >
                    <Text style={styles.timeText}>{slot.start}</Text>
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
                    onPress={() => openPicker(index, 'end')}
                  >
                    <Text style={styles.timeText}>{slot.end}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        ))}
      </View>
      {picker && (
        <DateTimePicker
          value={pickerValue}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
        />
      )}
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
    borderColor: "#EDEDED",
    boxShadow: "0px 0px 8px 0px #6B6B6B26",
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
    fontFamily: FontWeight.Medium,
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
    backgroundColor: COLORS.white,
   boxShadow: "0px 0px 12px 0px #76767626",
   flex:0,
   justifyContent:'center',
   alignItems:'center',
   paddingHorizontal:10,
   paddingVertical:12,
  },
  outlineBtnText: {
    color: "#383838",
  },
});

export default TrainerSetupStep2;
