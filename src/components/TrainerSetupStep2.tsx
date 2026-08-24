import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import TimePickerModal from "./TimePickerModal";
import { COLORS, toLocalTime } from "../config/constants";
import FontWeight from "../hooks/useInterFonts";
import { Close } from "../../assets";
import {
  useCreateAvailabilityMutation,
  useUpdateAvailabilityMutation,
  useGetAvailabilityQuery,
} from "../services/api/availabilityApi";
import type { AvailabilitySlot } from "../services/api/availabilityApi";
import { Toast } from "./ToastManager";
import { useUser } from "../store/hooks";

/**
 * LOCAL COPY — this belongs in `src/config/strings.ts`
 * (e.g. `STRINGS.TRAINER_SETUP.step2`). It lives here only because strings.ts
 * is being edited concurrently. TODO: move into STRINGS and import from there.
 */
const STEP2_COPY = {
  title: "Define Your Availability",
  description:
    "Choose the days you want to take bookings and set the hours for each one. Days you leave off stay closed — nothing is filled in for you.",
  off: "OFF",
  tapToAdd: "Tap to add hours",
  setStart: "Set start",
  setEnd: "Set end",
  loading: "Loading your availability",
  hintNoDay:
    "Turn on at least one day and set its start and end time before going live.",
  hintIncomplete: (days: string) =>
    `Set both a start and an end time for ${days}.`,
  hintInvalidRange: (days: string) =>
    `End time must be later than the start time for ${days}.`,
  saveDraft: "Save Draft",
  confirm: "Confirm & Go Live",
  saving: "Saving...",
  saved: "Availability saved.",
  saveFailed: "Failed to save availability. Please try again.",
};

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/**
 * `enabled: false` -> the trainer has not opted this day in (OFF; not submitted).
 * `enabled: true` with an empty `start`/`end` -> opted in but the hours are still
 * pending, and the trainer must pick them before this step can be completed.
 */
export interface DaySchedule {
  day: string;
  enabled: boolean;
  start: string;
  end: string;
}

export const createEmptySchedule = (): DaySchedule[] =>
  DAYS_OF_WEEK.map((day) => ({ day, enabled: false, start: "", end: "" }));

/**
 * Initial highlighted value of the time picker only. Nothing is committed until
 * the trainer confirms the picker, so this is never saved on its own.
 */
const PICKER_FALLBACK = { start: "09:00 AM", end: "05:00 PM" };

const to12Hour = (time24: string): string => {
  const match = time24.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "";
  let hour = parseInt(match[1], 10);
  const minute = match[2];
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour.toString().padStart(2, "0")}:${minute} ${ampm}`;
};

/**
 * Server time -> 12h display string. New-contract records carry wall-clock
 * times in their own IANA `timezone`, shown unshifted; legacy records
 * (timezone "UTC" or absent) hold values the old client shifted device→UTC on
 * save, so only those are shifted back.
 */
const toDisplayTime = (
  raw?: string | null,
  recordTimezone?: string | null,
): string => {
  if (!raw) return "";
  const cleaned = String(raw).trim();
  if (!cleaned || cleaned.toUpperCase() === "OFF") return "";
  const isLegacyUtcRecord = !recordTimezone || recordTimezone === "UTC";
  const twelve = /[AP]M/i.test(cleaned)
    ? cleaned
    : /^\d{1,2}:\d{2}/.test(cleaned)
      ? to12Hour(cleaned)
      : "";
  if (twelve) return isLegacyUtcRecord ? toLocalTime(twelve) : twelve;
  return toLocalTime(cleaned);
};

const toMinutes = (time12: string): number | null => {
  if (!time12) return null;
  // Keep only digits, the colon and the AM/PM letters. The platform time
  // formatter emits assorted invisible spacing characters around AM/PM, so a
  // plain whitespace strip is not enough.
  const match = time12
    .replace(/[^0-9:APMapm]/g, "")
    .match(/(\d{1,2}):(\d{2})([AP]M)?/i);
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const ampm = match[3]?.toUpperCase();
  if (ampm === "PM" && hour < 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;
  return hour * 60 + minute;
};

const isComplete = (slot: DaySchedule) =>
  slot.enabled && !!slot.start && !!slot.end;

const isValidRange = (slot: DaySchedule) => {
  const start = toMinutes(slot.start);
  const end = toMinutes(slot.end);
  if (start === null || end === null) return false;
  return end > start;
};

const listDays = (slots: DaySchedule[]) =>
  slots.map((slot) => slot.day).join(", ");

interface TrainerSetupStep2Props {
  onSaveDraft: () => void;
  onConfirm: () => void;
  /**
   * `null` = not hydrated yet. Owned by TrainerSetup so stepping back to step 1
   * and forward again preserves whatever the trainer entered.
   */
  schedule: DaySchedule[] | null;
  setSchedule: React.Dispatch<React.SetStateAction<DaySchedule[] | null>>;
}

const TrainerSetupStep2: React.FC<TrainerSetupStep2Props> = ({
  onSaveDraft,
  onConfirm,
  schedule,
  setSchedule,
}) => {
  const user = useUser();
  const trainerId = user?.id;

  const [picker, setPicker] = useState<{
    mode: "start" | "end";
    dayIdx: number;
  } | null>(null);

  const { data, isLoading, isFetching } = useGetAvailabilityQuery(
    trainerId ? { trainerId } : { trainerId: "" },
    { skip: !trainerId }
  );

  const [createAvailability, { isLoading: isCreating }] =
    useCreateAvailabilityMutation();
  const [updateAvailability, { isLoading: isUpdating }] =
    useUpdateAvailabilityMutation();

  const existingRecord = useMemo(() => {
    if (!data || !data.status || !Array.isArray(data.data)) return null;
    return data.data[0] ?? null;
  }, [data]);

  const existingRecordId = existingRecord?.id ?? null;

  const isHydrating = !!trainerId && (isLoading || isFetching);

  // Hydrate exactly once: from the trainer's real saved availability if there is
  // any, otherwise from an all-off week. Never from a fabricated 9-5 default.
  useEffect(() => {
    if (schedule !== null) return;
    if (!trainerId) {
      setSchedule(createEmptySchedule());
      return;
    }
    if (isLoading || isFetching) return;

    const savedSlots = existingRecord?.slots ?? [];
    setSchedule(
      DAYS_OF_WEEK.map((day) => {
        // The server sends lowercase day names ("monday") — match loosely.
        const slot = savedSlots.find(
          (entry) => entry?.day?.toLowerCase() === day.toLowerCase()
        );
        const start = toDisplayTime(slot?.start_time, existingRecord?.timezone);
        const end = toDisplayTime(slot?.end_time, existingRecord?.timezone);
        const enabled = !!start && !!end;
        return {
          day,
          enabled,
          start: enabled ? start : "",
          end: enabled ? end : "",
        };
      })
    );
  }, [schedule, setSchedule, trainerId, isLoading, isFetching, existingRecord]);

  const rows = schedule ?? [];

  const updateRow = (dayIdx: number, patch: Partial<DaySchedule>) => {
    setSchedule((prev) =>
      (prev ?? createEmptySchedule()).map((slot, idx) =>
        idx === dayIdx ? { ...slot, ...patch } : slot
      )
    );
  };

  const enableDay = (dayIdx: number) => {
    // Opting a day in commits NO hours; it opens the picker so the trainer
    // chooses them explicitly.
    updateRow(dayIdx, { enabled: true, start: "", end: "" });
    setPicker({ mode: "start", dayIdx });
  };

  const disableDay = (dayIdx: number) => {
    updateRow(dayIdx, { enabled: false, start: "", end: "" });
    setPicker(null);
  };

  const openPicker = (dayIdx: number, mode: "start" | "end") => {
    setPicker({ mode, dayIdx });
  };

  const handleTimeConfirm = (time: string) => {
    if (!picker) {
      setPicker(null);
      return;
    }
    const { dayIdx, mode } = picker;
    updateRow(dayIdx, mode === "start" ? { start: time } : { end: time });
    // Chain into the end time so a day is never left half-set unnoticed.
    const needsEnd = mode === "start" && !rows[dayIdx]?.end;
    setPicker(needsEnd ? { mode: "end", dayIdx } : null);
  };

  const enabledRows = rows.filter((slot) => slot.enabled);
  const incompleteRows = enabledRows.filter((slot) => !isComplete(slot));
  const invalidRangeRows = enabledRows.filter(
    (slot) => isComplete(slot) && !isValidRange(slot)
  );
  const validRows = enabledRows.filter(
    (slot) => isComplete(slot) && isValidRange(slot)
  );

  let validation: { message: string; isError: boolean } | null = null;
  if (incompleteRows.length > 0) {
    validation = {
      message: STEP2_COPY.hintIncomplete(listDays(incompleteRows)),
      isError: false,
    };
  } else if (invalidRangeRows.length > 0) {
    validation = {
      message: STEP2_COPY.hintInvalidRange(listDays(invalidRangeRows)),
      isError: true,
    };
  } else if (validRows.length === 0) {
    validation = { message: STEP2_COPY.hintNoDay, isError: false };
  }

  const isSaving = isCreating || isUpdating;
  const canSubmit = !validation && !isSaving && !isHydrating;

  const handleConfirm = async () => {
    if (validation) {
      if (validation.isError) Toast.error(validation.message);
      else Toast.warning(validation.message);
      return;
    }

    // Only the days the trainer actually chose.
    const slots: AvailabilitySlot[] = [];
    for (const slot of validRows) {
      // Wall-clock times; the API slice attaches the device IANA timezone and
      // the server does all date-specific UTC/DST conversion.
      if (!slot.start || !slot.end) {
        Toast.error(STEP2_COPY.hintIncomplete(slot.day));
        return;
      }
      slots.push({ day: slot.day, start_time: slot.start, end_time: slot.end });
    }

    if (slots.length === 0) {
      Toast.warning(STEP2_COPY.hintNoDay);
      return;
    }

    // `/update` is a full replace: a day absent from `slots` is deleted
    // server-side, and explicit empty-string times are rejected with a 400 —
    // so switched-off days are simply omitted.

    try {
      if (existingRecordId) {
        await updateAvailability({ id: existingRecordId, slots }).unwrap();
      } else {
        await createAvailability({ slots }).unwrap();
      }
      Toast.success(STEP2_COPY.saved);
      onConfirm();
    } catch (e: any) {
      Toast.error(e?.data?.message || STEP2_COPY.saveFailed);
    }
  };

  const pickerInitialTime = picker
    ? rows[picker.dayIdx]?.[picker.mode] || PICKER_FALLBACK[picker.mode]
    : PICKER_FALLBACK.start;

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={{ marginBottom: 16 }}>
        <Text style={styles.sectionTitle}>{STEP2_COPY.title}</Text>
        <Text style={styles.sectionDesc}>{STEP2_COPY.description}</Text>
      </View>

      {isHydrating && schedule === null ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>{STEP2_COPY.loading}</Text>
        </View>
      ) : (
        <View style={styles.sessionCard}>
          {rows.map((slot, index) => (
            <View key={slot.day} style={styles.scheduleRow}>
              <Text style={styles.dayText}>{slot.day}</Text>
              <View style={styles.timeRow}>
                {!slot.enabled ? (
                  <TouchableOpacity
                    style={styles.offRow}
                    onPress={() => enableDay(index)}
                  >
                    <View style={styles.badgeOff}>
                      <Text style={styles.badgeText}>{STEP2_COPY.off}</Text>
                    </View>
                    <Text style={styles.offHint}>{STEP2_COPY.tapToAdd}</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.timeBtn,
                        !slot.start && styles.timeBtnPending,
                      ]}
                      onPress={() => openPicker(index, "start")}
                    >
                      <Text
                        style={[
                          styles.timeText,
                          !slot.start && styles.timeTextPending,
                        ]}
                      >
                        {slot.start || STEP2_COPY.setStart}
                      </Text>
                    </TouchableOpacity>
                    <Text style={[styles.dash, { marginHorizontal: 2 }]}>
                      -
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.timeBtn,
                        !slot.end && styles.timeBtnPending,
                      ]}
                      onPress={() => openPicker(index, "end")}
                    >
                      <Text
                        style={[
                          styles.timeText,
                          !slot.end && styles.timeTextPending,
                        ]}
                      >
                        {slot.end || STEP2_COPY.setEnd}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeDayBtn}
                      onPress={() => disableDay(index)}
                    >
                      <Image source={Close} style={styles.removeDayIcon} />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {validation && (
        <View style={styles.hintBox}>
          <Text
            style={[styles.hintText, validation.isError && styles.hintError]}
          >
            {validation.message}
          </Text>
        </View>
      )}

      <TimePickerModal
        visible={!!picker}
        initialTime={pickerInitialTime}
        onConfirm={handleTimeConfirm}
        onCancel={() => setPicker(null)}
      />

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.outlineBtn]}
          onPress={onSaveDraft}
        >
          <Text style={[styles.actionBtnText, styles.outlineBtnText]}>
            {STEP2_COPY.saveDraft}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, !canSubmit && styles.actionBtnDisabled]}
          onPress={handleConfirm}
          disabled={isSaving || isHydrating}
        >
          <Text style={styles.actionBtnText}>
            {isSaving ? STEP2_COPY.saving : STEP2_COPY.confirm}
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
  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 40,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: FontWeight.Medium,
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
  offRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
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
  offHint: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: FontWeight.Medium,
    flexShrink: 1,
  },
  dash: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  timeBtn: {
    borderWidth: 0.5,
    borderColor: COLORS.border,
    paddingHorizontal: 5,
    paddingVertical: 9,
    width: "38%",
    borderRadius: 32,
  },
  timeBtnPending: {
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  timeText: {
    fontSize: 14,
    fontFamily: FontWeight.SemiBold,
    textAlign: "center",
    color: COLORS.text,
  },
  timeTextPending: {
    color: COLORS.textSecondary,
    fontFamily: FontWeight.Medium,
  },
  removeDayBtn: {
    position: "absolute",
    right: 0,
  },
  removeDayIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.error,
  },
  hintBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  hintText: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textSecondary,
    fontFamily: FontWeight.Medium,
  },
  hintError: {
    color: COLORS.error,
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
  actionBtnDisabled: {
    opacity: 0.45,
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
