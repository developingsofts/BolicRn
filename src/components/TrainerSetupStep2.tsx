import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, DIMENSIONS, toUtc } from '../config/constants';
import FontWeight from '../hooks/useInterFonts';
import { Close } from '../../assets';
import { useCreateAvailabilityMutation } from '../services/api/availabilityApi';

interface TrainerSetupStep2Props {
  onSaveDraft: () => void;
  onConfirm: () => void;
}


const defaultSchedule = [
  { day: 'Monday', start: '09:00 AM', end: '05:00 PM' },
  { day: 'Tuesday', start: '09:00 AM', end: '05:00 PM' },
  { day: 'Wednesday', start: '09:00 AM', end: '05:00 PM' },
  { day: 'Thursday', start: '09:00 AM', end: '05:00 PM' },
  { day: 'Friday', start: '09:00 AM', end: '05:00 PM' },
  { day: 'Saturday', start: '09:00 AM', end: '05:00 PM' },
  { day: 'Sunday', start: '09:00 AM', end: '05:00 PM' },
];

const TrainerSetupStep2: React.FC<TrainerSetupStep2Props> = ({ onSaveDraft, onConfirm }) => {
  const [schedule, setSchedule] = useState(defaultSchedule);
  const [picker, setPicker] = useState<{visible: boolean; mode: 'start'|'end'; dayIdx: number}|null>(null);
  const [pickerValue, setPickerValue] = useState<Date>(new Date());
  const [createAvailability, { isLoading: isCreating }] = useCreateAvailabilityMutation();

  // Helper to format time as 12-hour with leading zero and AM/PM in caps
  const formatTime = (date: Date) => {
    let [time, ampm] = date
      .toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
      .split(' ');
    let [hour, minute] = time.split(':');
    if (hour.length === 1) hour = '0' + hour;
    return `${hour}:${minute} ${ampm ? ampm.toUpperCase() : ''}`.trim();
  };

  // Toggle OFF/ON for a day
  const handleToggleOff = (dayIdx: number) => {
    setSchedule(prev => prev.map((slot, idx) => {
      if (idx !== dayIdx) return slot;
      const isOff = !slot.start && !slot.end;
      if (isOff) {
        return { ...slot, start: '09:00 AM', end: '05:00 PM' };
      } else {
        return { ...slot, start: '', end: '' };
      }
    }));
  };

  // Open picker for a slot
  const openPicker = (dayIdx: number, mode: 'start'|'end') => {
    const timeStr = schedule[dayIdx][mode];
    console.log('[openPicker] timeStr:', JSON.stringify(timeStr), 'mode:', mode, 'dayIdx:', dayIdx);
    let h = 9, m = 0;
    if (timeStr) {
      // Remove Unicode spaces and normalize whitespace
      const cleaned = timeStr.replace(/[\u202F\u00A0\u2007\u2060\u2009\u200A\u200B\u200C\u200D\uFEFF\s]+/g, ' ').trim();
      // Accept both 09:00 AM and 09:00
      const match = cleaned.match(/(\d{1,2}):(\d{2}) ?([AP]M)?/i);
      console.log('[openPicker] cleaned:', JSON.stringify(cleaned), 'match:', match);
      if (match) {
        h = parseInt(match[1], 10);
        m = parseInt(match[2], 10);
        if (match[3]) {
          // If AM/PM present, convert to 24-hour
          if (match[3].toUpperCase() === 'PM' && h < 12) h += 12;
          if (match[3].toUpperCase() === 'AM' && h === 12) h = 0;
        }
      }
    }
    const date = new Date();
    date.setHours(h, m, 0, 0);
    console.log('[openPicker] Setting pickerValue to:', date);
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
      let newTime = formatTime(selectedDate);
      // Ensure AM/PM is uppercase
      newTime = newTime.replace(/am|pm/, (match) => match.toUpperCase());
      setSchedule(prev => prev.map((slot, idx) =>
        idx === picker.dayIdx ? { ...slot, [picker.mode]: newTime } : slot
      ));
    }
    setPicker(null);
  };

  // Handle confirm: call createAvailability API
  const handleConfirm = async () => {
    // Convert schedule to API format, times in UTC
    const slots = schedule.map(slot => {

      const isOff = !slot.start && !slot.end;
      const startUtc = isOff ? '' : toUtc(slot.start);
      const endUtc = isOff ? '' : toUtc(slot.end);
      console.log('[handleConfirm] slot:', slot, 'startUtc:', startUtc, 'endUtc:', endUtc);
      return {
        day: slot.day,
        start_time: startUtc,
        end_time: endUtc,
      };
    });
    try {
      console.log('Creating availability with slots:', slots);
      await createAvailability({ slots }).unwrap();
      Alert.alert('Success', 'Availability created successfully!');
      onConfirm();
    } catch (e) {
      Alert.alert('Error', 'Failed to create availability.');
    }
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
        {schedule.map((slot, index) => {
          const isOff = !slot.start && !slot.end;
          return (
            <View key={index} style={styles.scheduleRow}>
              <Text style={styles.dayText}>{slot.day}</Text>
              <View style={styles.timeRow}>
                {isOff ? (
                  <>
                    <TouchableOpacity onPress={() => handleToggleOff(index)}>
                      <View style={styles.badgeOff}><Text style={styles.badgeText}>OFF</Text></View>
                    </TouchableOpacity>
                    <Text style={styles.dash}>-</Text>
                    <TouchableOpacity onPress={() => handleToggleOff(index)}>
                      <View style={styles.badgeOff}><Text style={styles.badgeText}>OFF</Text></View>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={{ position: 'relative' }}>
                      <TouchableOpacity
                        style={{ position: 'absolute', left: -10, top: -10, zIndex: 2 }}
                        onPress={() => handleToggleOff(index)}
                      >
                        <Image
                          source={Close}
                          style={{ width: 28, height: 28, tintColor: COLORS.error }}
                        />
                      </TouchableOpacity>
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
                    </View>
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
          );
        })}
      </View>
      {picker && (
        <DateTimePicker
          value={pickerValue}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
        />
      )}
      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.actionBtn, styles.outlineBtn]} onPress={onSaveDraft}>
          <Text style={[styles.actionBtnText, styles.outlineBtnText]}>Save Draft</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleConfirm} disabled={isCreating}>
          <Text style={styles.actionBtnText}>{isCreating ? 'Saving...' : 'Confirm & Go Live'}</Text>
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
