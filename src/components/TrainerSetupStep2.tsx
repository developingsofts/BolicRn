import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import TimePickerModal from "./TimePickerModal";
import { COLORS, DIMENSIONS, toUtc } from "../config/constants";
import FontWeight from "../hooks/useInterFonts";
import { Close } from "../../assets";
import { useCreateAvailabilityMutation } from "../services/api/availabilityApi";

interface TrainerSetupStep2Props {
  onSaveDraft: () => void;
  onConfirm: () => void;
}

const defaultSchedule = [
  { day: "Monday", start: "09:00 AM", end: "05:00 PM" },
  { day: "Tuesday", start: "09:00 AM", end: "05:00 PM" },
  { day: "Wednesday", start: "09:00 AM", end: "05:00 PM" },
  { day: "Thursday", start: "09:00 AM", end: "05:00 PM" },
  { day: "Friday", start: "09:00 AM", end: "05:00 PM" },
  { day: "Saturday", start: "09:00 AM", end: "05:00 PM" },
  { day: "Sunday", start: "09:00 AM", end: "05:00 PM" },
];

const TrainerSetupStep2: React.FC<TrainerSetupStep2Props> = ({
  onSaveDraft,
  onConfirm,
}) => {
  const [schedule, setSchedule] = useState(defaultSchedule);
  const [picker, setPicker] = useState<{
    mode: "start" | "end";
    dayIdx: number;
  } | null>(null);
  const [createAvailability, { isLoading: isCreating }] =
    useCreateAvailabilityMutation();

  const handleToggleOff = (dayIdx: number) => {
    setSchedule((prev) =>
      prev.map((slot, idx) => {
        if (idx !== dayIdx) return slot;
        const isOff = !slot.start && !slot.end;
        if (isOff) {
          return { ...slot, start: "09:00 AM", end: "05:00 PM" };
        } else {
          return { ...slot, start: "", end: "" };
        }
      })
    );
  };

  const openPicker = (dayIdx: number, mode: "start" | "end") => {
    setPicker({ mode, dayIdx });
  };

  const handleTimeConfirm = (time: string) => {
    if (picker) {
      setSchedule((prev) =>
        prev.map((slot, idx) =>
          idx === picker.dayIdx ? { ...slot, [picker.mode]: time } : slot
        )
      );
    }
    setPicker(null);
  };

  const handleConfirm = async () => {
    const slots = schedule.map((slot) => {
      const isOff = !slot.start && !slot.end;
      const startUtc = isOff ? "" : toUtc(slot.start);
      const endUtc = isOff ? "" : toUtc(slot.end);
      console.log(
        "[handleConfirm] slot:",
        slot,
        "startUtc:",
        startUtc,
        "endUtc:",
        endUtc
      );
      return {
        day: slot.day,
        start_time: startUtc,
        end_time: endUtc,
      };
    });
    try {
      console.log("Creating availability with slots:", slots);
      await createAvailability({ slots }).unwrap();
      Alert.alert("Success", "Availability created successfully!");
      onConfirm();
    } catch (e) {
      Alert.alert("Error", "Failed to create availability.");
    }
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={{ marginBottom: 16 }}>
        <Text style={styles.sectionTitle}>Define Your Availability</Text>
        <Text style={styles.sectionDesc}>
          Set your standard weekly hours. You can always adjust this and block
          off specific dates later.
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
                    <TouchableOpacity
                      style={{
                        width: "40%",
                      }}
                      onPress={() => handleToggleOff(index)}
                    >
                      <View style={styles.badgeOff}>
                        <Text style={styles.badgeText}>OFF</Text>
                      </View>
                    </TouchableOpacity>
                    <Text style={styles.dash}>-</Text>
                    <TouchableOpacity
                      style={{
                        width: "40%",
                      }}
                      onPress={() => handleToggleOff(index)}
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
                      onPress={() => openPicker(index, "start")}
                    >
                      <Text style={styles.timeText}>{slot.start}</Text>
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
                      onPress={() => openPicker(index, "end")}
                    >
                      <Text style={styles.timeText}>{slot.end}</Text>
                    </TouchableOpacity>
                    {!isOff && (
                      <TouchableOpacity
                        style={{ position: "absolute", right: 0 }}
                        onPress={() => handleToggleOff(index)}
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
                    )}
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
            ? schedule[picker.dayIdx][picker.mode] || "09:00 AM"
            : "09:00 AM"
        }
        onConfirm={handleTimeConfirm}
        onCancel={() => setPicker(null)}
      />

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.outlineBtn]}
          onPress={onSaveDraft}
        >
          <Text style={[styles.actionBtnText, styles.outlineBtnText]}>
            Save Draft
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleConfirm}
          disabled={isCreating}
        >
          <Text style={styles.actionBtnText}>
            {isCreating ? "Saving..." : "Confirm & Go Live"}
          </Text>
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
    paddingHorizontal: 12,
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
  timeText: {
    fontSize: 14,
    fontFamily: FontWeight.SemiBold,
    textAlign: "center",
    color: COLORS.text,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
    marginBottom: 30,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 5,
    paddingVertical: 12,
    alignItems: "center",
  },
  actionBtnText: {
    color: COLORS.black,
    fontSize: 14,
    fontFamily: FontWeight.Medium,
  },
  outlineBtn: {
    backgroundColor: COLORS.surface,
    boxShadow: "0px 0px 12px 0px #76767626",
    flex: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  outlineBtnText: {
    color: COLORS._383838,
  },
});

export default TrainerSetupStep2;
