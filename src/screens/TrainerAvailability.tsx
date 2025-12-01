import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import BasicTopBar from "../components/BasicTopBar";
import { COLORS, DIMENSIONS } from "../config/constants";
import { useUser } from "../store/hooks";
import { useGetAvailabilityQuery } from "../services/api/availabilityApi";
import { Close } from "../../assets";

interface DayAvailability {
  startTime: string;
  endTime: string;
  isOff: boolean;
}

interface WeekAvailability {
  [key: string]: DayAvailability;
}

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

const TrainerAvailability: React.FC<{ navigation: any }> = ({ navigation }) => {
  const user = useUser();
  const [availability, setAvailability] = useState<WeekAvailability>({});
  const [initialAvailability, setInitialAvailability] =
    useState<WeekAvailability>({});
  const [picker, setPicker] = useState<{
    day: string;
    mode: "start" | "end";
  } | null>(null);
  const [pickerValue, setPickerValue] = useState(new Date());

  // Fetch slots from API
  const { data, isLoading, isFetching } = useGetAvailabilityQuery(
    user?.id ? { trainerId: user.id } : { trainerId: "" },
    { skip: !user?.id }
  );

  // Convert API slots to WeekAvailability
  useEffect(() => {
    const week: WeekAvailability = {};
    daysOfWeek.forEach((day) => {
      week[day] = { startTime: "", endTime: "", isOff: false };
    });
    if (
      data &&
      data.status &&
      Array.isArray(data.data) &&
      data.data.length > 0
    ) {
      const slots = data.data[0]?.slots || [];
      slots.forEach((slot) => {
        const day = slot.day;
        if (day && week[day] !== undefined) {
          if (slot.start_time === "OFF" && slot.end_time === "OFF") {
            week[day] = { startTime: "OFF", endTime: "OFF", isOff: true };
          } else {
            week[day] = {
              startTime: slot.start_time || "",
              endTime: slot.end_time || "",
              isOff: false,
            };
          }
        }
      });
    }
    // Fallback to 09:00 AM/05:00 PM in 12-hour format if missing
    daysOfWeek.forEach((day) => {
      // Only fallback if value is missing or OFF
      if (!week[day].startTime || week[day].startTime === "OFF") {
        week[day].startTime = week[day].isOff ? "OFF" : "09:00 AM";
      } else if (
        !week[day].isOff &&
        !week[day].startTime.includes("AM") &&
        !week[day].startTime.includes("PM")
      ) {
        // If value is 21:00 or similar, but should be 09:00 AM fallback only if value is 09:00 or 9:00
        if (week[day].startTime === "09:00" || week[day].startTime === "9:00") {
          week[day].startTime = "09:00 AM";
        } else {
          week[day].startTime = to12Hour(week[day].startTime);
        }
      }
      if (!week[day].endTime || week[day].endTime === "OFF") {
        week[day].endTime = week[day].isOff ? "OFF" : "05:00 PM";
      } else if (
        !week[day].isOff &&
        !week[day].endTime.includes("AM") &&
        !week[day].endTime.includes("PM")
      ) {
        if (week[day].endTime === "17:00" || week[day].endTime === "5:00") {
          week[day].endTime = "05:00 PM";
        } else {
          week[day].endTime = to12Hour(week[day].endTime);
        }
      }
    });
    setAvailability(week);
    setInitialAvailability(week);
  }, [data]);

  // Convert 24-hour to 12-hour format
  function to12Hour(time: string) {
    if (!time || time === "OFF") return time;
    const [h, m] = time.split(":");
    let hour = parseInt(h, 10);
    const min = m || "00";
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour.toString().padStart(2, "0")}:${min} ${ampm}`;
  }


  // Helper to format time as 12-hour (AM/PM)
  const formatTime = (date: Date) => {
    // Always pad hour with zero if less than 10, and ensure AM/PM is uppercase
    let [time, ampm] = date
      .toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .split(' ');
    let [hour, minute] = time.split(':');
    if (hour.length === 1) hour = '0' + hour;
    return `${hour}:${minute} ${ampm ? ampm.toUpperCase() : ''}`.trim();
  };

  const openPicker = (day: string, mode: "start" | "end") => {
    const timeStr =
      mode === "start"
        ? availability[day].startTime
        : availability[day].endTime;
    let [h, m] = timeStr.split(":");
    const date = new Date();
    date.setHours(Number(h) || 9, Number(m) || 0, 0, 0);
    setPickerValue(date);
    setPicker({ day, mode });
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    if (event.type === "dismissed") {
      setPicker(null);
      return;
    }
    if (selectedDate && picker) {
      let newTime = formatTime(selectedDate);
      // Ensure AM/PM is uppercase
      newTime = newTime.replace(/am|pm/, (match) => match.toUpperCase());
      setAvailability((prev) => ({
        ...prev,
        [picker.day]: {
          ...prev[picker.day],
          [picker.mode === "start" ? "startTime" : "endTime"]: newTime,
        },
      }));
    }
    setPicker(null);
  };

  const handleToggleOff = (day: string) => {
    setAvailability((prev) => {
      const isCurrentlyOff = prev[day].isOff;
      if (isCurrentlyOff) {
        // Restore to default times
        return {
          ...prev,
          [day]: {
            startTime: "09:00 AM",
            endTime: "05:00 PM",
            isOff: false,
          },
        };
      } else {
        return {
          ...prev,
          [day]: {
            startTime: "OFF",
            endTime: "OFF",
            isOff: true,
          },
        };
      }
    });
  };

  const handleDiscard = () => {
    setAvailability(initialAvailability);
    Alert.alert("Changes discarded");
  };

  const handleUpdate = () => {
    Alert.alert("Availability updated successfully!");
  };

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <BasicTopBar
        onBackPress={() => navigation.goBack()}
        title="My Availability"
        subtitle="Manage your availability"
        containerStyle={{
          paddingTop: DIMENSIONS.spacing.xxl,
          paddingBottom: DIMENSIONS.spacing.lg,
        }}
      />
      {isLoading || isFetching ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.sessionCard}>
            {daysOfWeek.map((day, idx) => (
              <View key={day} style={styles.scheduleRow}>
                <Text style={styles.dayText}>{day}</Text>
                <View style={styles.timeRow}>
                  {/* Start time with cross icon overlay */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', position: 'relative' }}>
                    {availability[day].isOff ? (
                      <React.Fragment>
                        <View style={styles.offCircle}>
                          <Text style={styles.offTextCircle}>OFF</Text>
                        </View>
                        <Text style={styles.dash}>-</Text>
                        <View style={styles.offCircle}>
                          <Text style={styles.offTextCircle}>OFF</Text>
                        </View>
                      </React.Fragment>
                    ) : (
                      <React.Fragment>
                        <View style={{ position: 'relative' }}>
                          <TouchableOpacity
                            style={{ position: 'absolute', left: -10, top: -10, zIndex: 2 }}
                            onPress={() => handleToggleOff(day)}
                          >
                            <Image
                              source={Close}
                              style={{
                                width: 28,
                                height: 28,
                                tintColor: COLORS.error,
                              }}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={{
                              borderWidth: 0.5,
                              borderColor: "#0000001F",
                              paddingHorizontal: 12,
                              paddingVertical: 9,
                              borderRadius: 32,
                            }}
                            onPress={() => openPicker(day, "start")}
                          >
                            <Text style={styles.timeText}>
                              {availability[day].startTime}
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.dash}>-</Text>
                        <TouchableOpacity
                          style={{
                            borderWidth: 0.5,
                            borderColor: "#0000001F",
                            paddingHorizontal: 12,
                            paddingVertical: 9,
                            borderRadius: 32,
                          }}
                          onPress={() => openPicker(day, "end")}
                        >
                          <Text style={styles.timeText}>
                            {availability[day].endTime}
                          </Text>
                        </TouchableOpacity>
                      </React.Fragment>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Only render the picker once, outside the map */}
          {picker && (
            <DateTimePicker
              value={pickerValue}
              mode="time"
              is24Hour={false}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onTimeChange}
            />
          )}

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.discardBtn]}
              onPress={handleDiscard}
            >
              <Text style={styles.discardText}>Discard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.updateBtn]}
              onPress={handleUpdate}
            >
              <Text style={styles.updateText}>Update</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    offCircle: {
      backgroundColor: '#E6E6E6',
      borderRadius: 32,
      paddingHorizontal: 18,
      paddingVertical: 9,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 60,
    },
    offTextCircle: {
      color: '#C77A7A',
      fontWeight: '600',
      fontSize: 18,
      textAlign: 'center',
    },
  offTimeBox: {
    backgroundColor: "#E6E6E6",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 50,
  },
  offTimeText: {
    color: "#DA9393",
    fontWeight: "bold",
    fontSize: 15,
    textAlign: "center",
  },
  offBadgeContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  offBadge: {
    backgroundColor: COLORS.error,
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 15,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
    textAlign: "center",
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
    shadowColor: "#000",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  dayText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    minWidth: 100,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "60%",
  },
  badgeOff: {
    backgroundColor: "#E6E6E6",
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
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    gap: 10,
    flexWrap: "wrap",
    width: "100%",
    justifyContent: "space-between",
  },
  satSunOffRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 8,
  },
  satSunOffText: {
    fontSize: 15,
    color: COLORS.error,
    fontWeight: "600",
    marginHorizontal: 8,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  toggleBtn: {
    minWidth: 120,
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 15,
  },
  dayLabel: {
    width: 90,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  timeInputs: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "600",
  },
  offTextActive: {
    color: COLORS.white,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  actionBtn: {
    borderRadius: 8,
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  discardBtn: {
    backgroundColor: COLORS.surface,
  },
  updateBtn: {
    backgroundColor: COLORS.primary,
  },
  discardText: {
    color: COLORS.error,
    fontWeight: "600",
    fontSize: 16,
  },
  updateText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 16,
  },
});

export default TrainerAvailability;
