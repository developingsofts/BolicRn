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
import { COLORS, DIMENSIONS, toUtc, toLocalTime } from "../config/constants";
import { useUser } from "../store/hooks";
import {
  useGetAvailabilityQuery,
  useUpdateAvailabilityMutation,
  useDeleteAvailabilityMutation,
} from "../services/api/availabilityApi";
import { Close } from "../../assets";
import { useAuth } from "../contexts/AuthContext";

interface DayAvailability {
  start_time: string;
  end_time: string;
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
  "Sunday",
];

const TrainerAvailability: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<WeekAvailability>({});
  const [initialAvailability, setInitialAvailability] =
    useState<WeekAvailability>({});
  const [picker, setPicker] = useState<{
    day: string;
    mode: "start" | "end";
  } | null>(null);
  const [pickerValue, setPickerValue] = useState(new Date());
  const [updateAvailability, { isLoading: isUpdating }] =
    useUpdateAvailabilityMutation();
  const [deleteAvailability] = useDeleteAvailabilityMutation();

  // Fetch slots from API
  const { data, isLoading, isFetching } = useGetAvailabilityQuery(
    user?.id ? { trainerId: user.id } : { trainerId: "" },
    { skip: !user?.id }
  );

  // Convert API slots to WeekAvailability
  useEffect(() => {
    const week: WeekAvailability = {};
    daysOfWeek.forEach((day) => {
      week[day] = { start_time: "", end_time: "" };
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
        // Treat as off if both start_time and end_time are 'OFF' or empty
        const isOff =
          (slot && slot.start_time === "OFF" && slot.end_time === "OFF") ||
          (slot.start_time === "" && slot.end_time === "");
        if (day && week[day] !== undefined) {
          if (isOff) {
            week[day] = { start_time: "", end_time: "" };
          } else {
            // Convert UTC times to local timezone
            const localStartTime = slot.start_time ? toLocalTime(slot.start_time) : "";
            const localEndTime = slot.end_time ? toLocalTime(slot.end_time) : "";
            console.log('[useEffect] slot:', slot, 'localStartTime:', localStartTime, 'localEndTime:', localEndTime);
            week[day] = {
              start_time: localStartTime,
              end_time: localEndTime,
            };
          }
        }
      });
    }
    // Fallback to 09:00 AM/05:00 PM in 12-hour format if missing
    daysOfWeek.forEach((day) => {
      // Defensive: ensure week[day] is always defined
      const dayObj = week[day] || { start_time: "", end_time: "" };
      // Only fallback if value is missing or OFF
      if (!dayObj.start_time || dayObj.start_time === "OFF") {
        dayObj.start_time =
          !dayObj.start_time && !dayObj.end_time ? "" : "09:00 AM";
      } else if (
        dayObj.start_time &&
        !dayObj.start_time.includes("AM") &&
        !dayObj.start_time.includes("PM")
      ) {
        if (dayObj.start_time === "09:00" || dayObj.start_time === "9:00") {
          dayObj.start_time = "09:00 AM";
        } else {
          dayObj.start_time = to12Hour(dayObj.start_time);
        }
      }
      if (!dayObj.end_time || dayObj.end_time === "OFF") {
        dayObj.end_time =
          !dayObj.start_time && !dayObj.end_time ? "" : "05:00 PM";
      } else if (
        dayObj.end_time &&
        !dayObj.end_time.includes("AM") &&
        !dayObj.end_time.includes("PM")
      ) {
        if (dayObj.end_time === "17:00" || dayObj.end_time === "5:00") {
          dayObj.end_time = "05:00 PM";
        } else {
          dayObj.end_time = to12Hour(dayObj.end_time);
        }
      }
      week[day] = dayObj;
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
      .split(" ");
    let [hour, minute] = time.split(":");
    if (hour.length === 1) hour = "0" + hour;
    return `${hour}:${minute} ${ampm ? ampm.toUpperCase() : ""}`.trim();
  };

  const openPicker = (day: string, mode: "start" | "end") => {
    const dayObj = availability[day] || { start_time: "", end_time: "" };
    const timeStr = mode === "start" ? dayObj.start_time : dayObj.end_time;

    let h = 9,
      m = 0;
    if (timeStr) {
      // Accept both 09:00 AM and 09:00, and handle Unicode/extra whitespace in AM/PM
      // Remove all non-breaking spaces and normalize whitespace
      const cleaned = timeStr.replace(/[\u202F\u00A0\s]+/g, " ").trim();
      const match = cleaned.match(/(\d{1,2}):(\d{2}) ?([AP]M)?/i);
      if (match) {
        h = parseInt(match[1], 10);
        m = parseInt(match[2], 10);
        if (match[3]) {
          const ampm = match[3].toUpperCase();
          if (ampm === "PM" && h < 12) h += 12;
          if (ampm === "AM" && h === 12) h = 0;
        }
      }
    }
    const date = new Date();
    date.setHours(h, m, 0, 0);
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
          [picker.mode === "start" ? "start_time" : "end_time"]: newTime,
        },
      }));
    }
    setPicker(null);
  };

  const handleToggleOff = (day: string) => {
    setAvailability((prev) => {
      const dayObj = prev[day] || { start_time: "", end_time: "" };
      const isCurrentlyOff = !dayObj.start_time && !dayObj.end_time;
      if (isCurrentlyOff) {
        // Restore to default times
        return {
          ...prev,
          [day]: {
            start_time: "09:00 AM",
            end_time: "05:00 PM",
          },
        };
      } else {
        return {
          ...prev,
          [day]: {
            start_time: "",
            end_time: "",
          },
        };
      }
    });
  };

  const handleDiscard = async () => {
    // Prepare slots: convert local times to UTC before sending
    const slots = daysOfWeek.map((day) => {
      const startUtc = toUtc("09:00 AM");
      const endUtc = toUtc("05:00 PM");
      console.log('[handleDiscard] day:', day, 'startUtc:', startUtc, 'endUtc:', endUtc);
      return {
        day,
        start_time: startUtc,
        end_time: endUtc,
      };
    });
    try {
      if (data && data.status && data.data && data.data.length > 0) {
        await updateAvailability({
          id: data.data[0]?.id ?? "",
          slots,
        }).unwrap();
        // Reset UI to default (show local times to user)
        const week: WeekAvailability = {};
        daysOfWeek.forEach((day) => {
          week[day] = { start_time: "09:00 AM", end_time: "05:00 PM" };
        });
        setAvailability(week);
        setInitialAvailability(week);
      }

      Alert.alert("Success", "Changes discarded and reset to default");
    } catch (e) {
      Alert.alert("Error", "Failed to reset availability.");
    }
  };

  const handleUpdate = async () => {
    console.log("Updating availability with state:", user?.id);
    if (!user?.id) return;
    // Convert availability state to slots array, converting local times to UTC
    const slots = daysOfWeek.map((day) => {
      const dayObj = availability[day] || { start_time: "", end_time: "" };
      const { start_time, end_time } = dayObj;
      const isOff = !start_time && !end_time;
      
      const startUtc = isOff ? "" : toUtc(start_time);
      const endUtc = isOff ? "" : toUtc(end_time);
      console.log('[handleUpdate] day:', day, 'localStart:', start_time, 'startUtc:', startUtc, 'localEnd:', end_time, 'endUtc:', endUtc);
      
      return {
        day,
        start_time: startUtc,
        end_time: endUtc,
      };
    });
    try {
      if (
        data &&
        data.status &&
        Array.isArray(data.data) &&
        data.data.length > 0
      ) {
        await updateAvailability({
          id: data.data[0]?.id ?? "",
          slots,
        }).unwrap();
      }

      Alert.alert("Success", "Availability updated successfully!");
    } catch (e) {
      Alert.alert("Error", "Failed to update availability.");
    }
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
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      position: "relative",
                    }}
                  >
                    {!(availability[day] && availability[day].start_time) &&
                    !(availability[day] && availability[day].end_time) ? (
                      <React.Fragment>
                        <TouchableOpacity onPress={() => handleToggleOff(day)}>
                          <View style={styles.offCircle}>
                            <Text style={styles.offTextCircle}>OFF</Text>
                          </View>
                        </TouchableOpacity>
                        <Text style={styles.dash}>-</Text>
                        <TouchableOpacity onPress={() => handleToggleOff(day)}>
                          <View style={styles.offCircle}>
                            <Text style={styles.offTextCircle}>OFF</Text>
                          </View>
                        </TouchableOpacity>
                      </React.Fragment>
                    ) : (
                      <React.Fragment>
                        <View style={{ position: "relative" }}>
                          <TouchableOpacity
                            style={{
                              position: "absolute",
                              left: -10,
                              top: -10,
                              zIndex: 2,
                            }}
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
                              {(availability[day] &&
                                availability[day].start_time) ||
                                ""}
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
                            {(availability[day] &&
                              availability[day].end_time) ||
                              ""}
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
              disabled={isUpdating}
            >
              <Text style={styles.updateText}>
                {isUpdating ? "Updating..." : "Update"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  offCircle: {
    backgroundColor: "#E6E6E6",
    borderRadius: 32,
    paddingHorizontal: 18,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
  },
  offTextCircle: {
    color: "#C77A7A",
    fontWeight: "600",
    fontSize: 18,
    textAlign: "center",
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
