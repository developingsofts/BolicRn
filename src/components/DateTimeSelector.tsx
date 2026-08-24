import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { skipToken } from "@reduxjs/toolkit/query/react";
import { COLORS, DIMENSIONS, toLocalTime } from "../config/constants";
import { STRINGS } from "../config/strings";
import FontWeight from "../hooks/useInterFonts";
import { r } from "../designing/responsiveDesigns";
import { useGetAvailabilityQuery } from "../services/api/availabilityApi";
import { BookingData } from "../services/api/bookingApi";

interface DaySlots {
  date: string;
  displayDate: string;
  day: string;
  slots: string[];
}

interface DateTimeSelectorProps {
  navigation: any;
  onBackPress?: () => void;

  title?: string;
  subtitle?: string;

  trainerName?: string;
  packageTitle?: string;
  price?: number;
  trainerId?: string;
  description?: string;
  sessionTitle?: string;
  sessionDescription?: string;
  sessionPriceDesc?: string;
  sessionPrice?: string;

  buttonText: string;
  onButtonPress?: (
    selectedDate: string,
    selectedTime: string,
    selectedSlots?: { date: string; time: string }[]
  ) => void;

  onUpdateBooking?: (booking: BookingData) => void;

  customDaySlots?: DaySlots[];

  /**
   * @deprecated Dead: no caller sets this, and the server rejects multi-slot
   * checkout with 400 MULTI_SLOT_UNSUPPORTED (one session per booking).
   * Delete along with `selectedSlots` when this file is next reworked.
   */
  allowMultipleSlots?: boolean;
  reschedule?: boolean;
  booking?: BookingData;
}

type SlotsByDay = {
  [dayName: string]: { start_time: string; end_time: string };
};

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const SHORT_TO_FULL_DAY: { [key: string]: string } = {
  Sun: "Sunday",
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
};

const MONTH_TO_NUMBER: { [key: string]: string } = {
  Jan: "01",
  Feb: "02",
  Mar: "03",
  Apr: "04",
  May: "05",
  Jun: "06",
  Jul: "07",
  Aug: "08",
  Sep: "09",
  Oct: "10",
  Nov: "11",
  Dec: "12",
};

/** How many days of the trainer's schedule the slot strip shows at once. */
const SLOT_WINDOW_DAYS = 3;
/** How far ahead "First Available" looks for a real, bookable slot. */
const FIRST_AVAILABLE_SEARCH_DAYS = 30;
/** A slot must start at least this many minutes from now to be bookable. */
const BOOKING_LEAD_MINUTES = 30;

const normalizeDayName = (day: string): string => {
  if (SHORT_TO_FULL_DAY[day]) return SHORT_TO_FULL_DAY[day];
  // The server sends lowercase day names ("monday"); match case-insensitively
  // against the canonical list instead of trusting the casing.
  const lower = (day ?? "").trim().toLowerCase();
  return (
    DAYS_OF_WEEK.find(
      (full) =>
        full.toLowerCase() === lower ||
        full.toLowerCase().slice(0, 3) === lower.slice(0, 3)
    ) ?? day
  );
};

const parseTimeToMinutes = (timeStr: string): number => {
  // Meridiem optional: the server's canonical wire form is bare 24-hour "16:00".
  const match = timeStr?.match(/(\d{1,2}):(\d{2})\s?(AM|PM)?/i);
  if (!match) return -1;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3]?.toUpperCase();
  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) return -1;
  return hours * 60 + minutes;
};

const minutesToTime = (mins: number): string => {
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")} ${ampm}`;
};

/** Normalizes "9:00 AM" / "09:00 am" to the exact label the slot strip renders. */
const canonicalizeTime = (timeStr: string): string => {
  const mins = parseTimeToMinutes(timeStr);
  return mins < 0 ? "" : minutesToTime(mins);
};

/**
 * Wire time -> display label. New-contract records carry wall-clock times in
 * their own IANA `timezone` — shown unshifted. Legacy records (timezone "UTC"
 * or absent) hold values the old client shifted device→UTC on save; only
 * those are shifted back via toLocalTime.
 */
const displayFromWire = (
  raw: string,
  recordTimezone?: string | null
): string => {
  const canonical = canonicalizeTime(raw);
  if (!canonical) return "";
  if (recordTimezone && recordTimezone !== "UTC") return canonical;
  const shifted = toLocalTime(canonical);
  return canonicalizeTime(shifted) || canonical;
};

const toDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;

const dayNameForDateKey = (dateKey: string): string => {
  const date = new Date(dateKey);
  if (Number.isNaN(date.getTime())) return "";
  return DAYS_OF_WEEK[date.getDay()];
};

const dropPastSlots = (
  dateKey: string,
  slots: string[],
  leadMinutes: number = BOOKING_LEAD_MINUTES
): string[] => {
  const now = new Date();
  if (dateKey !== toDateKey(now)) return slots;
  const cutoff = now.getHours() * 60 + now.getMinutes() + leadMinutes;
  return slots.filter((slot) => parseTimeToMinutes(slot) >= cutoff);
};

const generateHourlySlots = (
  startTime: string,
  endTime: string,
  stepMinutes: number = 60
): string[] => {
  const slots: string[] = [];
  const startMins = parseTimeToMinutes(startTime);
  let endMins = parseTimeToMinutes(endTime);

  if (startMins < 0 || endMins < 0) return slots;

  if (endMins <= startMins) {
    // Overnight window (e.g. 10:00 PM - 02:00 AM).
    endMins += 24 * 60;
  }

  for (let mins = startMins; mins < endMins; mins += stepMinutes) {
    slots.push(minutesToTime(mins % (24 * 60)));
  }

  return slots;
};

/**
 * Real slots the trainer offers on this calendar date, with past times for
 * today removed. Never fabricates: a day the trainer did not configure, or a
 * day whose slots have all passed, comes back empty.
 */
const slotsForDate = (
  dateKey: string,
  slotsByDay: SlotsByDay,
  leadMinutes?: number,
  stepMinutes?: number
): string[] => {
  const dayName = dayNameForDateKey(dateKey);
  const availability = dayName ? slotsByDay[dayName] : undefined;
  if (!availability?.start_time || !availability?.end_time) return [];
  return dropPastSlots(
    dateKey,
    generateHourlySlots(availability.start_time, availability.end_time, stepMinutes),
    leadMinutes
  );
};

const buildDaySlots = (
  referenceDate: string,
  slotsByDay: SlotsByDay,
  leadMinutes?: number,
  stepMinutes?: number
): DaySlots[] => {
  const refDate = new Date(referenceDate);
  if (Number.isNaN(refDate.getTime())) return [];

  const refMonth = refDate.getMonth();
  const refYear = refDate.getFullYear();
  const days: DaySlots[] = [];

  for (let i = 0; i < SLOT_WINDOW_DAYS; i++) {
    const date = new Date(refDate);
    date.setDate(refDate.getDate() + i);

    if (date.getMonth() !== refMonth || date.getFullYear() !== refYear) {
      break;
    }

    const dateKey = toDateKey(date);
    days.push({
      date: dateKey,
      displayDate: date.getDate().toString().padStart(2, "0"),
      day: DAYS_OF_WEEK[date.getDay()],
      slots: slotsForDate(dateKey, slotsByDay, leadMinutes, stepMinutes),
    });
  }

  return days;
};

const DateTimeSelector: React.FC<DateTimeSelectorProps> = ({
  trainerId,
  sessionTitle = "Single Session",
  sessionDescription = "One-on-one personalized training session.",
  sessionPriceDesc = "",
  sessionPrice = "",
  buttonText,
  onButtonPress,
  onUpdateBooking,
  customDaySlots,
  allowMultipleSlots = false,
  reschedule = false,
  booking,
}) => {
  const today = toDateKey(new Date());
  const COPY = STRINGS.SELECT_DATE_TIME;

  const hasCustomSlots = Array.isArray(customDaySlots);

  const {
    data: availabilityData,
    isLoading: isLoadingAvailability,
    isError: isAvailabilityError,
  } = useGetAvailabilityQuery(
    // Never fire the query without a real trainer id.
    !hasCustomSlots && trainerId ? { trainerId } : skipToken
  );

  /** Real availability from the server, keyed by weekday name, in local time. */
  const slotsByDay = useMemo<SlotsByDay>(() => {
    if (!availabilityData || !availabilityData.status || !availabilityData.data) {
      return {};
    }

    const byDay: SlotsByDay = {};
    availabilityData.data.forEach((record) => {
      (record?.slots ?? []).forEach((slot) => {
        if (!slot?.day || !slot.start_time || !slot.end_time) return;
        byDay[normalizeDayName(slot.day)] = {
          start_time: displayFromWire(slot.start_time, record?.timezone),
          end_time: displayFromWire(slot.end_time, record?.timezone),
        };
      });
    });
    return byDay;
  }, [availabilityData]);

  const {
    date: bookedDate,
    time: bookedTime,
  } = useMemo(() => {
    if (!reschedule || !booking?.date || !booking?.time) {
      return { date: "", time: "" };
    }

    // Incoming display format: "Monday - Aug 4, 2026".
    const dateMatch = booking.date.match(/(\w+)\s*-\s*(\w+)\s+(\d+),\s*(\d+)/);
    const parsedDate = dateMatch
      ? `${dateMatch[4]}-${MONTH_TO_NUMBER[dateMatch[2]] || "01"}-${dateMatch[3].padStart(
          2,
          "0"
        )}`
      : "";

    return { date: parsedDate, time: canonicalizeTime(booking.time) };
  }, [reschedule, booking?.date, booking?.time]);

  const [calendarSelectedDate, setCalendarSelectedDate] = useState<string>(
    bookedDate || today
  );
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedSlots, setSelectedSlots] = useState<
    { date: string; time: string }[]
  >([]);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  const isLoadingSlots = !hasCustomSlots && !!trainerId && isLoadingAvailability;
  const hasAvailabilitySource =
    hasCustomSlots || Object.keys(slotsByDay).length > 0;

  // Server-owned grid values from `/list` (BACKEND-CHANGES.md §20); the
  // hardcoded constants remain only as fallbacks for older payloads.
  const grid = availabilityData?.grid;
  const leadMinutes = grid?.lead_time_minutes ?? BOOKING_LEAD_MINUTES;
  const stepMinutes = grid?.slot_duration_minutes ?? 60;
  const horizonDays = grid?.booking_horizon_days ?? FIRST_AVAILABLE_SEARCH_DAYS;

  const displayedSlots = useMemo<DaySlots[]>(() => {
    if (hasCustomSlots) {
      return (customDaySlots ?? []).map((daySlot) => ({
        ...daySlot,
        slots: dropPastSlots(daySlot.date, daySlot.slots ?? [], leadMinutes),
      }));
    }
    if (!hasAvailabilitySource) return [];
    return buildDaySlots(calendarSelectedDate, slotsByDay, leadMinutes, stepMinutes);
  }, [
    hasCustomSlots,
    customDaySlots,
    hasAvailabilitySource,
    calendarSelectedDate,
    slotsByDay,
    leadMinutes,
    stepMinutes,
  ]);

  const availableSlotsForDate = useCallback(
    (dateKey: string): string[] => {
      if (hasCustomSlots) {
        const match = (customDaySlots ?? []).find(
          (daySlot) => daySlot.date === dateKey
        );
        return match ? dropPastSlots(dateKey, match.slots ?? [], leadMinutes) : [];
      }
      return slotsForDate(dateKey, slotsByDay, leadMinutes, stepMinutes);
    },
    [hasCustomSlots, customDaySlots, slotsByDay, leadMinutes, stepMinutes]
  );

  /** Soonest real slot, looked up beyond the visible window. */
  const firstAvailable = useMemo(() => {
    if (hasCustomSlots) {
      const match = (customDaySlots ?? [])
        .map((daySlot) => ({
          date: daySlot.date,
          slots: dropPastSlots(daySlot.date, daySlot.slots ?? [], leadMinutes),
        }))
        .find((daySlot) => daySlot.slots.length > 0);
      return match ? { date: match.date, time: match.slots[0] } : null;
    }

    if (!hasAvailabilitySource) return null;

    const start = new Date();
    for (let i = 0; i < horizonDays; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dateKey = toDateKey(date);
      const slots = slotsForDate(dateKey, slotsByDay, leadMinutes, stepMinutes);
      if (slots.length > 0) {
        return { date: dateKey, time: slots[0] };
      }
    }
    return null;
  }, [
    hasCustomSlots,
    customDaySlots,
    hasAvailabilitySource,
    slotsByDay,
    leadMinutes,
    stepMinutes,
    horizonDays,
  ]);

  const applySelection = useCallback((date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setSelectedSlots([{ date, time }]);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedDate("");
    setSelectedTime("");
    setSelectedSlots([]);
  }, []);

  // Initial selection, once real slots are known.
  useEffect(() => {
    if (hasAutoSelected || isLoadingSlots || displayedSlots.length === 0) {
      return;
    }

    if (reschedule) {
      // Only keep the previously booked slot if it is still real availability.
      const bookedDay = displayedSlots.find((day) => day.date === bookedDate);
      if (bookedDay && bookedTime && bookedDay.slots.includes(bookedTime)) {
        applySelection(bookedDate, bookedTime);
      }
      setHasAutoSelected(true);
      return;
    }

    const firstBookable = displayedSlots.find((day) => day.slots.length > 0);
    if (!firstBookable) return;

    applySelection(firstBookable.date, firstBookable.slots[0]);
    setHasAutoSelected(true);
  }, [
    hasAutoSelected,
    isLoadingSlots,
    displayedSlots,
    reschedule,
    bookedDate,
    bookedTime,
    applySelection,
  ]);

  // Drop a selection that stopped being real (slot passed, availability changed).
  useEffect(() => {
    if (!selectedDate || !selectedTime) return;

    const daySlot = displayedSlots.find((slot) => slot.date === selectedDate);
    if (!daySlot || !daySlot.slots.includes(selectedTime)) {
      clearSelection();
    }
  }, [displayedSlots, selectedDate, selectedTime, clearSelection]);

  const markedDates = {
    [calendarSelectedDate]: {
      selected: true,
      selectedColor: COLORS.primary,
    },
  };

  const handleCalendarDateSelect = (date: string) => {
    setCalendarSelectedDate(date);

    const slots = availableSlotsForDate(date);
    if (slots.length > 0) {
      applySelection(date, slots[0]);
    } else {
      clearSelection();
    }
  };

  const handleTimeSlotSelect = (date: string, time: string) => {
    if (!allowMultipleSlots) {
      applySelection(date, time);
      return;
    }

    const isAlreadySelected = selectedSlots.some(
      (slot) => slot.date === date && slot.time === time
    );
    const firstSelectedDate = selectedSlots[0]?.date;
    const isDifferentDate = date !== firstSelectedDate;

    if (isAlreadySelected) {
      const filtered = selectedSlots.filter(
        (slot) => !(slot.date === date && slot.time === time)
      );
      setSelectedSlots(filtered.length > 0 ? filtered : [{ date, time }]);
      setSelectedDate(filtered.length > 0 ? filtered[0].date : date);
      setSelectedTime(filtered.length > 0 ? filtered[0].time : time);
    } else if (isDifferentDate) {
      applySelection(date, time);
    } else {
      setSelectedSlots([...selectedSlots, { date, time }]);
      setSelectedDate(date);
      setSelectedTime(time);
    }
  };

  const handleContinue = () => {
    if (reschedule) {
      const updatedBooking = {
        ...booking,
        date: selectedDate,
        time: selectedTime,
      } as BookingData;
      onUpdateBooking && onUpdateBooking(updatedBooking);
      return;
    }

    if (allowMultipleSlots) {
      onButtonPress &&
        onButtonPress(
          selectedSlots[0]?.date || selectedDate,
          selectedSlots[0]?.time || selectedTime,
          selectedSlots
        );
    } else {
      onButtonPress && onButtonPress(selectedDate, selectedTime);
    }
  };

  const handleFirstAvailable = () => {
    if (!firstAvailable) return;
    setCalendarSelectedDate(firstAvailable.date);
    applySelection(firstAvailable.date, firstAvailable.time);
  };

  const renderCalendar = () => {
    const selectedDateObj = new Date(selectedDate || calendarSelectedDate);
    const monthName = Number.isNaN(selectedDateObj.getTime())
      ? new Date().toLocaleDateString("en-US", { month: "long" })
      : selectedDateObj.toLocaleDateString("en-US", { month: "long" });

    return (
      <View style={styles.calendar}>
        <Text style={styles.calendarTitle}>{monthName}</Text>
        <View style={styles.calendarCard}>
          <Calendar
            current={calendarSelectedDate}
            minDate={today}
            onDayPress={(day: DateData) => {
              handleCalendarDateSelect(day.dateString);
            }}
            markedDates={markedDates}
            hideArrows={true}
            customHeaderTitle={"N/A"}
            theme={{
              backgroundColor: COLORS.surface,
              calendarBackground: COLORS.surface,
              textSectionTitleColor: COLORS._5E5E5E,
              selectedDayBackgroundColor: COLORS.primary,
              selectedDayTextColor: COLORS.black,
              todayTextColor: COLORS.primary,
              dayTextColor: COLORS.app_black,
              textDisabledColor: COLORS._D9D9D9,
              dotColor: COLORS.primary,
              selectedDotColor: COLORS.white,
              monthTextColor: COLORS.app_black,
              textDayFontFamily: FontWeight.Regular,
              textMonthFontFamily: FontWeight.SemiBold,
              textDayHeaderFontFamily: FontWeight.Medium,
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
            }}
            disableMonthChange
          />
        </View>
      </View>
    );
  };

  const renderLoadingState = () => (
    <View style={styles.stateCard}>
      <ActivityIndicator size="small" color={COLORS.primary} />
      <Text style={styles.stateTitle}>{COPY.loadingAvailability}</Text>
    </View>
  );

  const renderMessageState = (title: string, hint?: string) => (
    <View style={styles.stateCard}>
      <Text style={styles.stateTitle}>{title}</Text>
      {!!hint && <Text style={styles.stateHint}>{hint}</Text>}
    </View>
  );

  const renderAvailableSlots = () => (
    <View style={styles.slotsCard}>
      <View style={styles.slotsHeader}>
        <Text style={styles.slotsTitle}>{COPY.availableSlots}</Text>
        {!!firstAvailable && (
          <TouchableOpacity onPress={handleFirstAvailable}>
            <Text style={styles.firstAvailableText}>
              {COPY.firstAvailable}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.slotsScrollContent}
      >
        {displayedSlots.map((daySlot, dayIndex) => {
          const isSelectedDay = selectedDate === daySlot.date;
          const hasSlots = daySlot.slots.length > 0;

          return (
            <View key={dayIndex} style={styles.dayColumn}>
              <TouchableOpacity
                disabled={!hasSlots}
                onPress={() =>
                  hasSlots &&
                  handleTimeSlotSelect(daySlot.date, daySlot.slots[0])
                }
                style={[
                  styles.dateButton,
                  isSelectedDay && styles.dateButtonSelected,
                  !hasSlots && styles.dateButtonEmpty,
                ]}
              >
                <Text
                  style={[
                    styles.dateNumber,
                    isSelectedDay && styles.dateNumberSelected,
                  ]}
                >
                  {daySlot.displayDate}
                </Text>
                <Text
                  style={[
                    styles.dateDay,
                    isSelectedDay && styles.dateDaySelected,
                  ]}
                >
                  {daySlot.day}
                </Text>
              </TouchableOpacity>

              {daySlot.slots.map((slot, slotIndex) => {
                const isSelected = allowMultipleSlots
                  ? selectedSlots.some(
                      (s) => s.date === daySlot.date && s.time === slot
                    )
                  : selectedDate === daySlot.date && selectedTime === slot;

                return (
                  <TouchableOpacity
                    key={slotIndex}
                    onPress={() => {
                      handleTimeSlotSelect(daySlot.date, slot);
                    }}
                    style={[
                      styles.timeSlot,
                      isSelected && styles.timeSlotSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.timeSlotText,
                        isSelected && styles.timeSlotTextSelected,
                      ]}
                    >
                      {slot}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {!hasSlots && (
                <View style={styles.noSlots}>
                  <Text style={styles.noSlotsText}>
                    {daySlot.date === today
                      ? COPY.noSlotsToday
                      : COPY.notAvailable}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderScheduleSection = () => {
    if (isLoadingSlots) {
      return renderLoadingState();
    }

    if (!hasCustomSlots && !trainerId) {
      return renderMessageState(COPY.missingTrainer);
    }

    if (isAvailabilityError) {
      return renderMessageState(COPY.availabilityError);
    }

    if (!hasAvailabilitySource) {
      return renderMessageState(COPY.noAvailability, COPY.noAvailabilityHint);
    }

    return (
      <>
        {renderCalendar()}
        {renderAvailableSlots()}
      </>
    );
  };

  const cardTitle = reschedule ? booking?.price?.title : sessionTitle;
  const cardDesc = reschedule ? booking?.price?.description : sessionDescription;
  const cardPrice = reschedule ? booking?.price?.price : sessionPrice;
  const hasPrice =
    cardPrice !== undefined &&
    cardPrice !== null &&
    String(cardPrice).trim() !== "";

  const isSelectionIncomplete =
    !selectedDate || !selectedTime || selectedSlots.length === 0;

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {renderScheduleSection()}

      <View style={styles.sessionCard}>
        {!!cardTitle && <Text style={styles.sessionTitle}>{cardTitle}</Text>}
        {!!cardDesc && <Text style={styles.sessionDesc}>{cardDesc}</Text>}
        {(hasPrice || !!sessionPriceDesc) && (
          <View style={styles.sessionDetailsRow}>
            <Text style={styles.sessionPriceDesc}>{sessionPriceDesc}</Text>
            {hasPrice && <Text style={styles.sessionPrice}>${cardPrice}</Text>}
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.continueButton,
          isSelectionIncomplete && styles.continueButtonDisabled,
        ]}
        onPress={handleContinue}
        disabled={isSelectionIncomplete}
      >
        <Text style={styles.continueButtonText}>{buttonText}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingBottom: DIMENSIONS.spacing.xxl,
  },
  calendar: {
    marginTop: DIMENSIONS.spacing.lg,
  },
  calendarCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: DIMENSIONS.spacing.lg,
    marginBottom: DIMENSIONS.spacing.lg,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  calendarTitle: {
    fontFamily: FontWeight.SemiBold,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.sm,
  },
  slotsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: DIMENSIONS.spacing.lg,
    marginBottom: DIMENSIONS.spacing.lg,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stateCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: r(28),
    paddingHorizontal: DIMENSIONS.spacing.lg,
    marginTop: DIMENSIONS.spacing.lg,
    marginBottom: DIMENSIONS.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: DIMENSIONS.spacing.sm,
  },
  stateTitle: {
    fontFamily: FontWeight.SemiBold,
    fontSize: r(15, "font"),
    color: COLORS.text,
    textAlign: "center",
  },
  stateHint: {
    fontFamily: FontWeight.Regular,
    fontSize: r(13, "font"),
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  slotsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: DIMENSIONS.spacing.md,
  },
  slotsTitle: {
    fontFamily: FontWeight.ExtraBold,
    fontSize: 18,
    color: COLORS.text,
  },
  firstAvailableText: {
    fontFamily: FontWeight.ExtraBold,
    fontSize: 15,
    color: COLORS._3A63ED,
  },
  slotsScrollContent: {
    gap: DIMENSIONS.spacing.md,
  },
  dayColumn: {
    gap: DIMENSIONS.spacing.sm,
    width: r(100),
  },
  dateButton: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: DIMENSIONS.spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  dateButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  dateNumber: {
    fontFamily: FontWeight.ExtraBold,
    fontSize: 18,
    color: COLORS.app_black,
  },
  dateNumberSelected: {
    color: COLORS.black,
  },
  dateDay: {
    fontFamily: FontWeight.ExtraBold,
    fontSize: 13,
    color: COLORS._5E5E5E,
  },
  dateDaySelected: {
    color: COLORS.black,
  },
  dateButtonEmpty: {
    opacity: 0.4,
  },
  noSlots: {
    paddingVertical: r(14),
    paddingHorizontal: r(8),
    alignItems: "center",
    justifyContent: "center",
  },
  noSlotsText: {
    fontFamily: FontWeight.Regular,
    fontSize: r(11, "font"),
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  timeSlot: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: DIMENSIONS.spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  timeSlotSelected: {
    backgroundColor: COLORS.primary,
  },
  timeSlotText: {
    fontFamily: FontWeight.SemiBold,
    fontSize: 14,
    color: COLORS._222222,
  },
  timeSlotTextSelected: {
    color: COLORS.black,
  },
  sessionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    marginBottom: 24,
  },
  sessionTitle: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
    marginBottom: 6,
  },
  sessionDesc: {
    fontSize: 14,
    color: COLORS._5E5E5E,
    marginBottom: 10,
    fontFamily: FontWeight.Regular,
  },
  sessionDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sessionPriceDesc: {
    fontSize: 14,
    color: COLORS._595D66,
    fontFamily: FontWeight.SemiBold,
  },
  sessionPrice: {
    fontSize: 20,
    fontFamily: FontWeight.SemiBold,
    color: COLORS._2E6BDD,
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 5,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: DIMENSIONS.spacing.md,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS._D9D9D9,
  },
  continueButtonText: {
    fontFamily: FontWeight.Medium,
    fontSize: 14,
    color: COLORS.black,
  },
});

export default DateTimeSelector;
