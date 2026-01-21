import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { COLORS } from "../config/constants";

interface TimePickerModalProps {
  visible: boolean;
  initialTime: string;
  onConfirm: (time: string) => void;
  onCancel: () => void;
}

const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  initialTime,
  onConfirm,
  onCancel,
}) => {
  const [pickerValue, setPickerValue] = useState<Date>(new Date());
  const [tempPickerValue, setTempPickerValue] = useState<Date>(new Date());

  useEffect(() => {
    if (visible && initialTime) {
      const date = parseTimeString(initialTime);
      setPickerValue(date);
      setTempPickerValue(date);
    }
  }, [visible, initialTime]);

  const parseTimeString = (timeStr: string): Date => {
    let h = 9,
      m = 0;
    if (timeStr) {
      // Remove Unicode spaces and normalize whitespace
      const cleaned = timeStr
        .replace(
          /[\u202F\u00A0\u2007\u2060\u2009\u200A\u200B\u200C\u200D\uFEFF\s]+/g,
          " "
        )
        .trim();
      // Accept both 09:00 AM and 09:00
      const match = cleaned.match(/(\d{1,2}):(\d{2}) ?([AP]M)?/i);
      if (match) {
        h = parseInt(match[1], 10);
        m = parseInt(match[2], 10);
        if (match[3]) {
          // If AM/PM present, convert to 24-hour
          if (match[3].toUpperCase() === "PM" && h < 12) h += 12;
          if (match[3].toUpperCase() === "AM" && h === 12) h = 0;
        }
      }
    }
    const date = new Date();
    date.setHours(h, m, 0, 0);
    return date;
  };

  const formatTime = (date: Date): string => {
    let [time, ampm] = date
      .toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .split(" ");
    let [hour, minute] = time.split(":");
    if (hour.length === 1) hour = "0" + hour;
    return `${hour}:${minute} ${ampm ? ampm.toUpperCase() : ""}`.trim();
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    if (event.type === "dismissed") {
      onCancel();
      return;
    }
    if (selectedDate) {
      setTempPickerValue(selectedDate);
      // On Android, immediately confirm. On iOS, wait for OK button
      if (Platform.OS === "android") {
        let newTime = formatTime(selectedDate);
        newTime = newTime.replace(/am|pm/, (match) => match.toUpperCase());
        onConfirm(newTime);
      }
    }
  };

  const handleConfirm = () => {
    let newTime = formatTime(tempPickerValue);
    newTime = newTime.replace(/am|pm/, (match) => match.toUpperCase());
    onConfirm(newTime);
  };

  if (!visible) return null;

  // Android: Show native picker directly
  if (Platform.OS === "android") {
    return (
      <DateTimePicker
        value={tempPickerValue}
        mode="time"
        is24Hour={false}
        display="default"
        onChange={onTimeChange}
      />
    );
  }

  // iOS: Show custom modal with spinner
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.iosPickerOverlay}>
        <View style={styles.iosPickerContainer}>
          <View style={styles.iosPickerHeader}>
            <TouchableOpacity
              style={styles.iosPickerHeaderButton}
              onPress={onCancel}
            >
              <Text style={styles.iosPickerCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.iosPickerTitle, styles.iosPickerHeaderTitle]}>
              Select Time
            </Text>
            <TouchableOpacity
              style={styles.iosPickerHeaderButton}
              onPress={handleConfirm}
            >
              <Text style={styles.iosPickerOk}>OK</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={tempPickerValue}
            mode="time"
            is24Hour={false}
            display="spinner"
            onChange={onTimeChange}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  iosPickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  iosPickerContainer: {
    backgroundColor: "#F9F9F9",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  iosPickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    width: "100%",
  },
  iosPickerHeaderTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
  },
  iosPickerHeaderButton: {
    zIndex: 1,
  },
  iosPickerCancel: {
    fontSize: 16,
    color: COLORS.error,
    fontWeight: "600",
  },
  iosPickerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  iosPickerOk: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: "600",
  },
});

export default TimePickerModal;
