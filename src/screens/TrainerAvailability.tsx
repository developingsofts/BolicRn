import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import TimePickerModal from "../components/TimePickerModal";
import { SafeAreaView } from "react-native-safe-area-context";
import BasicTopBar from "../components/BasicTopBar";
import RefreshableScrollView from "../components/RefreshableScrollView";
import ConfirmationDialog from "../components/ConfirmationDialog";
import { Toast } from "../components/ToastManager";
import { COLORS, DIMENSIONS, toLocalTime } from "../config/constants";
import {
  useGetAvailabilityQuery,
  useCreateAvailabilityMutation,
  useUpdateAvailabilityMutation,
  useDeleteAvailabilityMutation,
} from "../services/api/availabilityApi";
import { Close } from "../../assets";
import { useAuth } from "../contexts/AuthContext";
import FontWeight from "../hooks/useInterFonts";

/**
 * LOCAL COPY BLOCK — this belongs in `STRINGS.TRAINER_AVAILABILITY`
 * (src/config/strings.ts). It lives here only because strings.ts is being
 * edited concurrently by other work; move it into STRINGS verbatim and swap
 * the references when that lands.
 */
const COPY = {
  title: "My Availability",
  subtitle: "Manage your availability",
  off: "OFF",
  discard: "Discard",
  update: "Update",
  updating: "Saving...",
  removeDayA11y: (day: string) => `Remove availability for ${day}`,
  setStartA11y: (day: string) => `Set start time for ${day}`,
  setEndA11y: (day: string) => `Set end time for ${day}`,
  discardTitle: "Discard unsaved changes?",
  discardMessage:
    "Your edits will be reverted to your last saved schedule. Nothing on the server changes.",
  discardConfirm: "Discard edits",
  discardCancel: "Keep editing",
  discarded: "Unsaved changes discarded",
  saved: "Availability saved",
  savedWithDeleteFailures:
    "Schedule saved, but some removed days could not be deleted. Pull to refresh and try again.",
  saveFailed: "Could not save your availability. Please try again.",
  invalidTime: "That time could not be read. Please pick it again.",
  incompleteDay: (day: string) =>
    `${day} needs both a start and an end time, or remove the day.`,
  zeroLengthDay: (day: string) =>
    `${day} starts and ends at the same time. Adjust it or remove the day.`,
};

/**
 * Initial wheel positions for the time picker ONLY.
 * These are never written into a day's schedule and are never sent to the
 * server: an unset day stays unset until the trainer picks a time.
 */
const PICKER_FALLBACK_START = "09:00 AM";
const PICKER_FALLBACK_END = "05:00 PM";

interface DayAvailability {
  /** Local wall-clock display time, "hh:mm AM". Empty string = unavailable. */
  start_time: string;
  end_time: string;
  /** Server-side id for this day's slot, when the list response provides one. */
  slotId?: string;
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

// Narrow / non-breaking spaces that Intl time formatting emits on some devices.
const UNICODE_SPACES =
  /[\u202F\u00A0\u2007\u2060\u2009\u200A\u200B\u200C\u200D\uFEFF\s]+/g;

const pad2 = (value: number) => value.toString().padStart(2, "0");

const cleanTimeString = (raw?: string | null) =>
  raw ? String(raw).replace(UNICODE_SPACES, " ").trim() : "";

const from24Hour = (hour: number, minute: number) => {
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return "";
  const ampm = hour >= 12 ? "PM" : "AM";
  let display = hour % 12;
  if (display === 0) display = 12;
  return `${pad2(display)}:${pad2(minute)} ${ampm}`;
};

/**
 * Canonicalise anything time-shaped into the "hh:mm AM" form that `toUtc`,
 * `toLocalTime` and TimePickerModal all expect. Accepts 12-hour ("5:00 pm",
 * "05:00 P.M."), 24-hour ("17:00", "17:00:00") and the "OFF" sentinel.
 * Returns "" when the value is not a readable time, so a corrupt value is
 * dropped loudly instead of being written to the server as garbage.
 */
const normalizeDisplayTime = (raw?: string | null): string => {
  const cleaned = cleanTimeString(raw);
  if (!cleaned || cleaned.toUpperCase() === "OFF") return "";

  const twelve = cleaned.match(
    /^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AP])\.?\s*M\.?$/i
  );
  if (twelve) {
    const hour = parseInt(twelve[1], 10);
    const minute = parseInt(twelve[2], 10);
    const isPm = twelve[3].toUpperCase() === "P";
    if (Number.isNaN(hour) || Number.isNaN(minute) || minute > 59) return "";
    if (hour <= 12) {
      let hour24 = hour % 12;
      if (isPm) hour24 += 12;
      return from24Hour(hour24, minute);
    }
    // e.g. "17:00 PM" — the meridiem is noise, treat the value as 24-hour.
    return from24Hour(hour, minute);
  }

  const twentyFour = cleaned.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (twentyFour) {
    const hour = parseInt(twentyFour[1], 10);
    const minute = parseInt(twentyFour[2], 10);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return "";
    return from24Hour(hour, minute);
  }

  return "";
};

/** Server (UTC) value -> local display time. Returns "" when unreadable. */
const serverTimeToLocalDisplay = (
  raw?: string | null,
  recordTimezone?: string | null,
): string => {
  const cleaned = cleanTimeString(raw);
  if (!cleaned || cleaned.toUpperCase() === "OFF") return "";
  const asDisplay = normalizeDisplayTime(cleaned);
  // New-contract records carry wall-clock times in their own IANA `timezone`
  // — display them unshifted. Legacy records (timezone "UTC" or absent) hold
  // values the old client shifted device→UTC on save; only those shift back.
  const isLegacyUtcRecord = !recordTimezone || recordTimezone === "UTC";
  if (asDisplay) {
    if (!isLegacyUtcRecord) return asDisplay;
    return normalizeDisplayTime(toLocalTime(asDisplay));
  }
  // Fall back for ISO / date-time payloads, which toLocalTime parses directly.
  return normalizeDisplayTime(toLocalTime(cleaned));
};

const normalizeDayName = (raw?: string | null): string | undefined => {
  const cleaned = cleanTimeString(raw);
  if (!cleaned) return undefined;
  const lower = cleaned.toLowerCase();
  return daysOfWeek.find(
    (day) =>
      day.toLowerCase() === lower ||
      day.toLowerCase().slice(0, 3) === lower.slice(0, 3)
  );
};

const emptyWeek = (): WeekAvailability => {
  const week: WeekAvailability = {};
  daysOfWeek.forEach((day) => {
    week[day] = { start_time: "", end_time: "" };
  });
  return week;
};

const isDayOff = (day?: DayAvailability) => !day?.start_time && !day?.end_time;

/**
 * Build the editor state from the server's slot list. A day the server does not
 * mention, or mentions as OFF / empty / a zero-length range, is simply
 * unavailable — never a fabricated 9-to-5.
 */
const buildWeekFromSlots = (
  slots: ReadonlyArray<{
    day?: string;
    start_time?: string;
    end_time?: string;
    id?: string | number;
    _id?: string | number;
  }>,
  parentId?: string | number,
  recordTimezone?: string | null
): WeekAvailability => {
  const week = emptyWeek();
  slots.forEach((slot) => {
    const day = normalizeDayName(slot.day);
    if (!day) return;

    const start = serverTimeToLocalDisplay(slot.start_time, recordTimezone);
    const end = serverTimeToLocalDisplay(slot.end_time, recordTimezone);

    // A per-slot id is what /trainer-availability-slot/delete needs. Never
    // treat the parent availability id as a slot id — deleting that would wipe
    // the trainer's whole schedule.
    const rawSlotId = slot.id ?? slot._id;
    const slotId =
      rawSlotId !== undefined &&
      rawSlotId !== null &&
      String(rawSlotId) !== String(parentId ?? "")
        ? String(rawSlotId)
        : undefined;

    // Zero-length or empty ranges are not availability.
    if (!start && !end) {
      week[day] = { start_time: "", end_time: "", slotId };
      return;
    }
    if (start && end && start === end) {
      week[day] = { start_time: "", end_time: "", slotId };
      return;
    }

    week[day] = { start_time: start, end_time: end, slotId };
  });
  return week;
};

const weeksEqual = (a: WeekAvailability, b: WeekAvailability) =>
  daysOfWeek.every(
    (day) =>
      (a[day]?.start_time || "") === (b[day]?.start_time || "") &&
      (a[day]?.end_time || "") === (b[day]?.end_time || "")
  );

const TrainerAvailability: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<WeekAvailability>(emptyWeek);
  const [savedAvailability, setSavedAvailability] =
    useState<WeekAvailability>(emptyWeek);
  const [refreshing, setRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDiscardVisible, setConfirmDiscardVisible] = useState(false);
  const [picker, setPicker] = useState<{
    day: string;
    mode: "start" | "end";
  } | null>(null);

  // Mirrors of the two states, so the fetch effect can decide synchronously
  // whether there are in-progress edits it must not clobber.
  const editorRef = useRef<WeekAvailability>(availability);
  const savedRef = useRef<WeekAvailability>(savedAvailability);
  const hasLoadedRef = useRef(false);

  const [createAvailability] = useCreateAvailabilityMutation();
  const [updateAvailability] = useUpdateAvailabilityMutation();
  const [deleteAvailability] = useDeleteAvailabilityMutation();

  const { data, isLoading, refetch } = useGetAvailabilityQuery(
    user?.id ? { trainerId: user.id } : { trainerId: "" },
    { skip: !user?.id }
  );

  const serverRecord = useMemo(() => {
    if (!data || !data.status || !Array.isArray(data.data)) return undefined;
    return data.data[0];
  }, [data]);

  const applySnapshot = useCallback((week: WeekAvailability) => {
    editorRef.current = week;
    savedRef.current = week;
    setAvailability(week);
    setSavedAvailability(week);
  }, []);

  const setEditorWeek = useCallback((week: WeekAvailability) => {
    editorRef.current = week;
    setAvailability(week);
  }, []);

  useEffect(() => {
    if (!data) return;
    const week = buildWeekFromSlots(
      serverRecord?.slots ?? [],
      serverRecord?.id,
      serverRecord?.timezone
    );
    const hasPendingEdits =
      hasLoadedRef.current && !weeksEqual(editorRef.current, savedRef.current);
    if (hasPendingEdits) {
      // A background refetch must not throw away what the trainer is typing.
      return;
    }
    hasLoadedRef.current = true;
    applySnapshot(week);
  }, [data, serverRecord, applySnapshot]);

  const isDirty = useMemo(
    () => !weeksEqual(availability, savedAvailability),
    [availability, savedAvailability]
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const openPicker = (day: string, mode: "start" | "end") => {
    setPicker({ day, mode });
  };

  const handleTimeConfirm = (time: string) => {
    if (picker) {
      const normalized = normalizeDisplayTime(time);
      if (!normalized) {
        Toast.error(COPY.invalidTime);
        setPicker(null);
        return;
      }
      const current = editorRef.current[picker.day] || {
        start_time: "",
        end_time: "",
      };
      setEditorWeek({
        ...editorRef.current,
        [picker.day]: {
          ...current,
          [picker.mode === "start" ? "start_time" : "end_time"]: normalized,
        },
      });
    }
    setPicker(null);
  };

  /** Mark a day unavailable locally; persisted (and deleted server-side) on save. */
  const handleRemoveDay = (day: string) => {
    const current = editorRef.current[day] || { start_time: "", end_time: "" };
    setEditorWeek({
      ...editorRef.current,
      [day]: { ...current, start_time: "", end_time: "" },
    });
  };

  const handleDiscardPress = () => {
    if (!isDirty || isSaving) return;
    setConfirmDiscardVisible(true);
  };

  /** Pure local revert to the last-loaded server state. Makes zero write calls. */
  const handleDiscardConfirm = () => {
    setConfirmDiscardVisible(false);
    setEditorWeek(savedRef.current);
    Toast.success(COPY.discarded);
  };

  const handleUpdate = async () => {
    if (!user?.id || isSaving || !isDirty) return;

    const current = editorRef.current;

    // Validate before writing: a half-filled or zero-length day must not be
    // silently completed or dropped.
    for (const day of daysOfWeek) {
      const dayObj = current[day];
      if (isDayOff(dayObj)) continue;
      if (!dayObj?.start_time || !dayObj?.end_time) {
        Toast.error(COPY.incompleteDay(day));
        return;
      }
      if (dayObj.start_time === dayObj.end_time) {
        Toast.error(COPY.zeroLengthDay(day));
        return;
      }
    }

    // Only days that actually have hours are sent. Off days are omitted rather
    // than sent as empty strings (the server rejects blanks with a 400). Times
    // go up as the trainer's wall clock — the API slice attaches the IANA
    // timezone and the server does all UTC/DST conversion; no device shifting.
    const activeSlots = daysOfWeek
      .filter((day) => !isDayOff(current[day]))
      .map((day) => ({
        day,
        start_time: normalizeDisplayTime(current[day].start_time),
        end_time: normalizeDisplayTime(current[day].end_time),
      }));

    if (activeSlots.some((slot) => !slot.start_time || !slot.end_time)) {
      // normalizeDisplayTime returns "" for an unparseable value — never ship that.
      Toast.error(COPY.saveFailed);
      return;
    }

    // Days the trainer removed that exist server-side with a deletable id.
    const removedSlotIds = daysOfWeek
      .filter(
        (day) =>
          isDayOff(current[day]) &&
          !isDayOff(savedRef.current[day]) &&
          !!savedRef.current[day]?.slotId
      )
      .map((day) => savedRef.current[day].slotId as string);

    setIsSaving(true);
    try {
      let failedDeletes = 0;
      if (removedSlotIds.length > 0) {
        const results = await Promise.allSettled(
          removedSlotIds.map((id) => deleteAvailability({ id }).unwrap())
        );
        failedDeletes = results.filter((r) => r.status === "rejected").length;
      }

      if (serverRecord?.id) {
        await updateAvailability({
          id: serverRecord.id,
          slots: activeSlots,
        }).unwrap();
      } else if (activeSlots.length > 0) {
        // No availability record yet (trainer skipped setup): create one,
        // instead of the previous silent no-op that still claimed success.
        await createAvailability({ slots: activeSlots }).unwrap();
      }

      // Baseline := what we just saved, dropping ids of deleted days, so the
      // incoming refetch is allowed to land and dirty state resets.
      const savedWeek: WeekAvailability = {};
      daysOfWeek.forEach((day) => {
        const dayObj = current[day] || { start_time: "", end_time: "" };
        savedWeek[day] = isDayOff(dayObj)
          ? { start_time: "", end_time: "" }
          : { ...dayObj };
      });
      applySnapshot(savedWeek);

      if (failedDeletes > 0) {
        Toast.error(COPY.savedWithDeleteFailures);
      } else {
        Toast.success(COPY.saved);
      }
      await refetch();
    } catch (e) {
      Toast.error(COPY.saveFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const actionsDisabled = !isDirty || isSaving;

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <BasicTopBar
        onBackPress={() => navigation.goBack()}
        title={COPY.title}
        subtitle={COPY.subtitle}
        containerStyle={{
          paddingTop: DIMENSIONS.spacing.xxl,
          paddingBottom: DIMENSIONS.spacing.lg,
        }}
      />
      {isLoading ? (
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
            {daysOfWeek.map((day) => {
              const isOff = isDayOff(availability[day]);
              return (
                <View key={day} style={styles.scheduleRow}>
                  <Text style={styles.dayText}>{day}</Text>
                  <View style={styles.timeRow}>
                    {isOff ? (
                      <>
                        <TouchableOpacity
                          style={{ width: "40%" }}
                          accessibilityLabel={COPY.setStartA11y(day)}
                          onPress={() => openPicker(day, "start")}
                        >
                          <View style={styles.badgeOff}>
                            <Text style={styles.badgeText}>{COPY.off}</Text>
                          </View>
                        </TouchableOpacity>
                        <Text style={styles.dash}>-</Text>
                        <TouchableOpacity
                          style={{ width: "40%" }}
                          accessibilityLabel={COPY.setEndA11y(day)}
                          onPress={() => openPicker(day, "end")}
                        >
                          <View style={styles.badgeOff}>
                            <Text style={styles.badgeText}>{COPY.off}</Text>
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
                          accessibilityLabel={COPY.setStartA11y(day)}
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
                          accessibilityLabel={COPY.setEndA11y(day)}
                          onPress={() => openPicker(day, "end")}
                        >
                          <Text style={styles.timeText}>
                            {availability[day]?.end_time || ""}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{ position: "absolute", right: 0 }}
                          accessibilityLabel={COPY.removeDayA11y(day)}
                          onPress={() => handleRemoveDay(day)}
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
                  ? availability[picker.day]?.start_time ||
                    PICKER_FALLBACK_START
                  : availability[picker.day]?.end_time || PICKER_FALLBACK_END
                : PICKER_FALLBACK_START
            }
            onConfirm={handleTimeConfirm}
            onCancel={() => setPicker(null)}
          />

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.discardBtn,
                actionsDisabled && styles.disabledBtn,
              ]}
              onPress={handleDiscardPress}
              disabled={actionsDisabled}
            >
              <Text style={styles.discardText}>{COPY.discard}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.updateBtn,
                actionsDisabled && styles.disabledBtn,
              ]}
              onPress={handleUpdate}
              disabled={actionsDisabled}
            >
              <Text style={styles.updateText}>
                {isSaving ? COPY.updating : COPY.update}
              </Text>
            </TouchableOpacity>
          </View>
        </RefreshableScrollView>
      )}

      <ConfirmationDialog
        visible={confirmDiscardVisible}
        title={COPY.discardTitle}
        message={COPY.discardMessage}
        confirmLabel={COPY.discardConfirm}
        cancelLabel={COPY.discardCancel}
        onConfirm={handleDiscardConfirm}
        onCancel={() => setConfirmDiscardVisible(false)}
      />
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
