import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import TimePickerModal from "../components/TimePickerModal";
import { SafeAreaView } from "react-native-safe-area-context";
import BasicTopBar from "../components/BasicTopBar";
import RefreshableScrollView from "../components/RefreshableScrollView";
import { COLORS, DIMENSIONS, toUtc, toLocalTime } from "../config/constants";
import { useUser } from "../store/hooks";
import {
  useGetAvailabilityQuery,
  useUpdateAvailabilityMutation,
  useDeleteAvailabilityMutation,
} from "../services/api/availabilityApi";
import { Close } from "../../assets";
import { useAuth } from "../contexts/AuthContext";
import FontWeight from "../hooks/useInterFonts";

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
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };
  const [initialAvailability, setInitialAvailability] =
    useState<WeekAvailability>({});
  const [picker, setPicker] = useState<{
    day: string;
    mode: "start" | "end";
  } | null>(null);
  const [updateAvailability, { isLoading: isUpdating }] =
    useUpdateAvailabilityMutation();
  const [deleteAvailability] = useDeleteAvailabilityMutation();

  const { data, isLoading, isFetching, refetch } = useGetAvailabilityQuery(
    user?.id ? { trainerId: user.id } : { trainerId: "" },
    { skip: !user?.id }
  );

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
        const isOff =
          (slot && slot.start_time === "OFF" && slot.end_time === "OFF") ||
          (slot.start_time === "" && slot.end_time === "");
        if (day && week[day] !== undefined) {
          if (isOff) {
            week[day] = { start_time: "", end_time: "" };
          } else {
            const localStartTime = slot.start_time
              ? toLocalTime(slot.start_time)
              : "";
            const localEndTime = slot.end_time
              ? toLocalTime(slot.end_time)
              : "";
            console.log(
              "[useEffect] slot:",
              slot,
              "localStartTime:",
              localStartTime,
              "localEndTime:",
              localEndTime
            );
            week[day] = {
              start_time: localStartTime,
              end_time: localEndTime,
            };
          }
        }
      });
    }
    daysOfWeek.forEach((day) => {
      const dayObj = week[day] || { start_time: "", end_time: "" };
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

  const formatTime = (date: Date) => {
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
    setPicker({ day, mode });
  };

  const handleTimeConfirm = (time: string) => {
    if (picker) {
      setAvailability((prev) => ({
        ...prev,
        [picker.day]: {
          ...prev[picker.day],
          [picker.mode === "start" ? "start_time" : "end_time"]: time,
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
    const slots = daysOfWeek.map((day) => {
      const startUtc = toUtc("09:00 AM");
      const endUtc = toUtc("05:00 PM");
      console.log(
        "[handleDiscard] day:",
        day,
        "startUtc:",
        startUtc,
        "endUtc:",
        endUtc
      );
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

        await refetch();

        Alert.alert("Success", "Changes discarded and reset to default");
      }
    } catch (e) {
      Alert.alert("Error", "Failed to reset availability.");
    }
  };

  const handleUpdate = async () => {
    console.log("Updating availability with state:", user?.id);
    if (!user?.id) return;
    const slots = daysOfWeek.map((day) => {
      const dayObj = availability[day] || { start_time: "", end_time: "" };
      const { start_time, end_time } = dayObj;
      const isOff = !start_time && !end_time;

      const startUtc = isOff ? "" : toUtc(start_time);
      const endUtc = isOff ? "" : toUtc(end_time);
      console.log(
        "[handleUpdate] day:",
        day,
        "localStart:",
        start_time,
        "startUtc:",
        startUtc,
        "localEnd:",
        end_time,
        "endUtc:",
        endUtc
      );

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
        <RefreshableScrollView
          contentContainerStyle={styles.scrollContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        >
          <View style={styles.sessionCard}>
            {daysOfWeek.map((day, idx) => {
              const isOff =
                !availability[day]?.start_time &&
                !availability[day]?.end_time;
              return (
                <View key={day} style={styles.scheduleRow}>
                  <Text style={styles.dayText}>{day}</Text>
                  <View style={styles.timeRow}>
                    {isOff ? (
                      <>
                        <TouchableOpacity
                          style={{ width: "40%" }}
                          onPress={() => handleToggleOff(day)}
                        >
                          <View style={styles.badgeOff}>
                            <Text style={styles.badgeText}>OFF</Text>
                          </View>
                        </TouchableOpacity>
                        <Text style={styles.dash}>-</Text>
                        <TouchableOpacity
                          style={{ width: "40%" }}
                          onPress={() => handleToggleOff(day)}
                        >
                          <View style={styles.badgeOff}>
                            <Text style={styles.badgeText}>OFF</Text>
                          </View>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <TouchableOpacity
                          style={{
                            borderWidth: 0.5,
                            borderColor: COLORS.border,
                            paddingHorizontal: 5,
                            paddingVertical: 9,
                            width: "40%",
                            borderRadius: 32,
                          }}
                          onPress={() => openPicker(day, "start")}
                        >
                          <Text style={styles.timeText}>
                            {availability[day]?.start_time || ""}
                          </Text>
                        </TouchableOpacity>
                        <Text style={[styles.dash, { marginHorizontal: 2 }]}>
                          -
                        </Text>
                        <TouchableOpacity
                          style={{
                            borderWidth: 0.5,
                            borderColor: COLORS.border,
                            paddingHorizontal: 5,
                            paddingVertical: 9,
                            width: "40%",
                            borderRadius: 32,
                          }}
                          onPress={() => openPicker(day, "end")}
                        >
                          <Text style={styles.timeText}>
                            {availability[day]?.end_time || ""}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{ position: "absolute", right: 0 }}
                          onPress={() => handleToggleOff(day)}
                        >
                          <Image
                            source={Close}
                            style={{
                              width: 24,
                              height: 24,
                              tintColor: COLORS.error,
                            }}
                          />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          <TimePickerModal
            visible={!!picker}
            initialTime={
              picker
                ? picker.mode === "start"
                  ? availability[picker.day]?.start_time || "09:00 AM"
                  : availability[picker.day]?.end_time || "05:00 PM"
                : "09:00 AM"
            }
            onConfirm={handleTimeConfirm}
            onCancel={() => setPicker(null)}
          />

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
        </RefreshableScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  offCircle: {
    backgroundColor: COLORS._E6E6E6,
    borderRadius: 32,
    paddingHorizontal: 18,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
  },
  offTextCircle: {
    color: COLORS._DA9393,
    fontFamily: FontWeight.SemiBold,
    fontSize: 15,
    textAlign: "center",
  },
  offTimeBox: {
    backgroundColor: COLORS._E6E6E6,
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
  scrollContent: {
    padding: 15,
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
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    position: "relative",
  },
  dayText: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.app_black,
    minWidth: 90,
    marginRight: 10,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 2,
    justifyContent: "flex-start",
  },
  badgeOff: {
    backgroundColor: COLORS._E6E6E6,
    borderRadius: 32,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  badgeText: {
    color: COLORS._DA9393,
    fontSize: 14,
    fontFamily: FontWeight.Medium,
    textAlign: "center",
  },
  dash: {
    color: COLORS.textSecondary,
    fontSize: 16,
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
    color: COLORS.black,
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
    color: COLORS.text,
    fontSize: 14,
    fontFamily: FontWeight.SemiBold,
    textAlign: "center",
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
    borderRadius: 5,
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  discardBtn: {
    backgroundColor: COLORS.surface,
  },
  updateBtn: {
    backgroundColor: COLORS.primary,
  },
  discardText: {
    color: COLORS._EB3434,
    fontFamily: FontWeight.Medium,
    fontSize: 14,
  },
  updateText: {
    color: COLORS.black,
    fontFamily: FontWeight.Medium,
    fontSize: 14,
  },
});

export default TrainerAvailability;
