import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { COLORS, DIMENSIONS, toLocalTime } from "../config/constants";
import FontWeight from "../hooks/useInterFonts";
import { r } from "../designing/responsiveDesigns";
import { LeftArrow } from "../../assets";
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

  allowMultipleSlots?: boolean;
  reschedule?: boolean;
  booking?: BookingData;
}

const parseTimeToMinutes = (timeStr: string): number => {
  const match = timeStr?.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
  if (!match) return -1;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const toDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

const BOOKING_LEAD_MINUTES = 30;

const dropPastSlots = (dateKey: string, slots: string[]): string[] => {
  const now = new Date();
  if (dateKey !== toDateKey(now)) return slots;
  const cutoff =
    now.getHours() * 60 + now.getMinutes() + BOOKING_LEAD_MINUTES;
  return slots.filter((slot) => parseTimeToMinutes(slot) >= cutoff);
};

const DateTimeSelector: React.FC<DateTimeSelectorProps> = ({
  navigation,
  onBackPress,
  title,
  subtitle,
  trainerName,
  packageTitle,
  price,
  trainerId,
  description,
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

  console.log("Received booking:", booking);

  const normalizeDayName = (day: string): string => {
    const fullDays = {
      Sun: "Sunday",
      Mon: "Monday",
      Tue: "Tuesday",
      Wed: "Wednesday",
      Thu: "Thursday",
      Fri: "Friday",
      Sat: "Saturday",
      Sunday: "Sunday",
      Monday: "Monday",
      Tuesday: "Tuesday",
      Wednesday: "Wednesday",
      Thursday: "Thursday",
      Friday: "Friday",
      Saturday: "Saturday",
    } as { [key: string]: string };
    return fullDays[day] || day;
  };

  const generateDefaultDaySlots = (): DaySlots[] => {
    const todayDate = new Date();
    const slots: DaySlots[] = [];

    for (let i = 0; i < 3; i++) {
      const date = new Date(todayDate);
      date.setDate(todayDate.getDate() + i);

      const dateStr = toDateKey(date);
      const displayDate = date.getDate().toString().padStart(2, "0");
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const day = days[date.getDay()];

      let timeSlots: string[] = [];
      if (i === 0) {
        timeSlots = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM"];
      } else if (i === 1) {
        timeSlots = ["2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM"];
      } else {
        timeSlots = ["7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM", "11:00 PM"];
      }

      slots.push({
        date: dateStr,
        displayDate,
        day,
        slots: dropPastSlots(dateStr, timeSlots),
      });
    }

    return slots;
  };

  const generateSlotsFromDate = (referenceDate: string): DaySlots[] => {
    const refDate = new Date(referenceDate);
    const refMonth = refDate.getMonth();
    const refYear = refDate.getFullYear();
    const slots: DaySlots[] = [];
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    for (let i = 0; i < 3; i++) {
      const date = new Date(refDate);
      date.setDate(refDate.getDate() + i);

      if (date.getMonth() !== refMonth || date.getFullYear() !== refYear) {
        break;
      }

      const dateStr = toDateKey(date);
      const displayDate = date.getDate().toString().padStart(2, "0");
      const dayName = daysOfWeek[date.getDay()];

      console.log(
        `[generateSlotsFromDate] Day ${i}: ${dayName} (${dateStr}), Looking for slots in slotsByDay...`
      );

      let timeSlots: string[] = [];

      if (
        slotsByDay[dayName] &&
        slotsByDay[dayName].start_time &&
        slotsByDay[dayName].end_time
      ) {
        console.log(
          `[generateSlotsFromDate] Found ${dayName} in API data:`,
          slotsByDay[dayName]
        );
        timeSlots = generateHourlySlots(
          slotsByDay[dayName].start_time,
          slotsByDay[dayName].end_time
        );
        console.log(
          `[generateSlotsFromDate] Generated ${timeSlots.length} slots for ${dayName}`
        );
      } else {
        console.log(
          `[generateSlotsFromDate] No API data for ${dayName}, slots will be empty`
        );
      }

      slots.push({
        date: dateStr,
        displayDate,
        day: dayName,
        slots: dropPastSlots(dateStr, timeSlots),
      });
    }

    console.log(
      `[generateSlotsFromDate] ===== FINAL GENERATED SLOTS =====`,
      slots.length,
      "days with",
      slots.reduce((sum, s) => sum + s.slots.length, 0),
      "total time slots"
    );
    return slots;
  };

  const initialDaySlots = customDaySlots || generateDefaultDaySlots();

  let defaultDate = today;
  let defaultTime = "09:00 AM";

  if (reschedule && booking && booking.date && booking.time) {
    const dateMatch = booking.date.match(/(\w+)\s*-\s*(\w+)\s+(\d+),\s*(\d+)/);
    if (dateMatch) {
      const monthStr = dateMatch[2];
      const dayStr = dateMatch[3];
      const yearStr = dateMatch[4];

      const monthMap: { [key: string]: string } = {
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

      const monthNum = monthMap[monthStr] || "01";
      const isoDate = `${yearStr}-${monthNum}-${dayStr.padStart(2, "0")}`;
      defaultDate = isoDate;
    }

    defaultTime = booking.time || "09:00 AM";

    console.log(
      "[DateTimeSelector] Reschedule mode - Pre-selecting booking date:",
      defaultDate,
      "time:",
      defaultTime
    );
  } else {
    defaultTime = "";
  }

  const [calendarSelectedDate, setCalendarSelectedDate] =
    useState<string>(defaultDate);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedSlots, setSelectedSlots] = useState<
    { date: string; time: string }[]
  >([]);
  const [slotsByDay, setSlotsByDay] = useState<{
    [key: string]: { start_time: string; end_time: string };
  }>({});
  const [isInitialMount, setIsInitialMount] = useState(!reschedule);

  const { data: availabilityData, isLoading: isLoadingAvailability } =
    useGetAvailabilityQuery(trainerId ? { trainerId } : { trainerId: "" }, {
      skip: !trainerId,
    });

  const timeToMinutes = (timeStr: string): number => {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();
    if (ampm === "PM" && hours !== 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
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

  const generateHourlySlots = (
    startTime: string,
    endTime: string
  ): string[] => {
    const slots: string[] = [];
    const startMins = timeToMinutes(startTime);
    let endMins = timeToMinutes(endTime);

    console.log(
      `[generateHourlySlots] Start: ${startTime} (${startMins}), End: ${endTime} (${endMins})`
    );

    if (endMins <= startMins) {
      endMins += 24 * 60;
      console.log(
        `[generateHourlySlots] Detected overnight slot, adjusted endMins to: ${endMins}`
      );
    }

    for (let mins = startMins; mins < endMins; mins += 60) {
      const displayMins = mins % (24 * 60);
      slots.push(minutesToTime(displayMins));
    }

    console.log(`[generateHourlySlots] Generated slots:`, slots);
    return slots;
  };

  useEffect(() => {
    if (availabilityData && availabilityData.status && availabilityData.data) {
      console.log(
        "[DateTimeSelector] ===== RAW API AVAILABILITY DATA =====",
        JSON.stringify(availabilityData.data, null, 2)
      );

      const slots = availabilityData.data[0]?.slots || [];
      console.log("[DateTimeSelector] ===== SLOTS FROM API =====", slots);
      console.log("[DateTimeSelector] Number of days with slots:", slots.length);

      const daySlots: {
        [key: string]: { start_time: string; end_time: string };
      } = {};

      slots.forEach((slot) => {
        if (slot.day && slot.start_time && slot.end_time) {
          const normalizedDay = normalizeDayName(slot.day);
          const localStart = toLocalTime(slot.start_time);
          const localEnd = toLocalTime(slot.end_time);
          console.log(
            `[DateTimeSelector] Day: ${slot.day} (normalized: ${normalizedDay}), UTC: ${slot.start_time}-${slot.end_time}, Local: ${localStart}-${localEnd}`
          );
          daySlots[normalizedDay] = {
            start_time: localStart,
            end_time: localEnd,
          };
        }
      });
      console.log("[DateTimeSelector] ===== FINAL SLOTS BY DAY =====", daySlots);
      console.log("[DateTimeSelector] Days with availability:", Object.keys(daySlots));
      setSlotsByDay(daySlots);
    } else if (availabilityData && !availabilityData.status) {
      console.log("[DateTimeSelector] No availability data from API");
      setSlotsByDay({});
    }
  }, [availabilityData]);

  const displayedSlots = generateSlotsFromDate(calendarSelectedDate);

  console.log(
    "[DateTimeSelector] ===== DISPLAYED SLOTS =====",
    "Calendar Date:",
    calendarSelectedDate,
    "Slots:",
    displayedSlots.map(slot => ({
      date: slot.date,
      day: slot.day,
      slotsCount: slot.slots.length,
      slots: slot.slots
    }))
  );

  useEffect(() => {
    if (!isInitialMount || isLoadingAvailability || !displayedSlots?.length) {
      return;
    }

    if (reschedule && booking && booking.time) {
      setSelectedDate(defaultDate);
      setSelectedTime(defaultTime);
      setSelectedSlots([{ date: defaultDate, time: defaultTime }]);
      setIsInitialMount(false);
      return;
    }

    const firstBookable = displayedSlots.find((day) => day.slots.length > 0);
    if (!firstBookable) {
      return;
    }

    setSelectedDate(firstBookable.date);
    setSelectedTime(firstBookable.slots[0]);
    setSelectedSlots([
      { date: firstBookable.date, time: firstBookable.slots[0] },
    ]);
    setIsInitialMount(false);
  }, [isInitialMount, displayedSlots, isLoadingAvailability]);

  useEffect(() => {
    if (selectedDate && selectedTime && displayedSlots) {
      const daySlot = displayedSlots.find((slot) => slot.date === selectedDate);

      if (!daySlot || daySlot.slots.length === 0) {
        console.log(
          "[DateTimeSelector] Selected date has no available slots, clearing selection"
        );
        setSelectedDate("");
        setSelectedTime("");
        setSelectedSlots([]);
      } else if (!daySlot.slots.includes(selectedTime)) {
        console.log(
          "[DateTimeSelector] Selected time not in available slots, clearing selection"
        );
        setSelectedDate("");
        setSelectedTime("");
        setSelectedSlots([]);
      }
    }
  }, [displayedSlots, selectedDate, selectedTime]);

  const markedDates = {
    [calendarSelectedDate]: {
      selected: true,
      selectedColor: COLORS.primary,
    },
  };

  const handleCalendarDateSelect = (date: string) => {
    setCalendarSelectedDate(date);

    const refDate = new Date(date);
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayName = daysOfWeek[refDate.getDay()];

    let firstTimeSlot = "";
    if (
      slotsByDay[dayName] &&
      slotsByDay[dayName].start_time &&
      slotsByDay[dayName].end_time
    ) {
      const slots = generateHourlySlots(
        slotsByDay[dayName].start_time,
        slotsByDay[dayName].end_time
      );
      firstTimeSlot = slots.length > 0 ? slots[0] : "";
    }

    if (firstTimeSlot) {
      setSelectedDate(date);
      setSelectedTime(firstTimeSlot);
      setSelectedSlots([{ date, time: firstTimeSlot }]);
    } else {
      setSelectedDate("");
      setSelectedTime("");
      setSelectedSlots([]);
    }

    console.log(
      "[handleCalendarDateSelect] Calendar date selected:",
      date,
      "First time:",
      firstTimeSlot
    );
  };

  const handleTimeSlotSelect = (date: string, time: string) => {
    console.log("[handleTimeSlotSelect] Selected date:", date, "Time:", time);

    if (allowMultipleSlots) {
      const slotKey = `${date}-${time}`;
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
        console.log("[handleTimeSlotSelect] Removed slot:", slotKey);
      } else if (isDifferentDate) {
        setSelectedSlots([{ date, time }]);
        setSelectedDate(date);
        setSelectedTime(time);
        console.log(
          "[handleTimeSlotSelect] Switched to different date, cleared previous slots. New slot:",
          slotKey
        );
      } else {
        setSelectedSlots([...selectedSlots, { date, time }]);
        setSelectedDate(date);
        setSelectedTime(time);
        console.log("[handleTimeSlotSelect] Added slot:", slotKey);
      }
    } else {
      setSelectedDate(date);
      setSelectedTime(time);
      setSelectedSlots([{ date, time }]);
    }
  };

  const handleContinue = () => {
    if (reschedule) {
      const updatedBooking = {
        ...booking,
        date: selectedDate,
        time: selectedTime,
      } as BookingData;
      updatedBooking && onUpdateBooking && onUpdateBooking(updatedBooking);
    } else {
      if (allowMultipleSlots) {
        onButtonPress && onButtonPress(
          selectedSlots[0]?.date || selectedDate,
          selectedSlots[0]?.time || selectedTime,
          selectedSlots
        );
      } else {
        onButtonPress && onButtonPress(selectedDate, selectedTime);
      }
    }
  };

  const handleFirstAvailable = () => {
    if (
      displayedSlots &&
      displayedSlots.length > 0 &&
      displayedSlots[0].slots.length > 0
    ) {
      const firstDate = displayedSlots[0].date;
      const firstTime = displayedSlots[0].slots[0];

      setCalendarSelectedDate(firstDate);
      setSelectedDate(firstDate);
      setSelectedTime(firstTime);

      if (allowMultipleSlots) {
        setSelectedSlots([{ date: firstDate, time: firstTime }]);
      } else {
        setSelectedSlots([{ date: firstDate, time: firstTime }]);
      }

      console.log(
        "[handleFirstAvailable] Selected first available:",
        firstDate,
        firstTime
      );
    }
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

  const renderAvailableSlots = () => {
    return (
      <View style={styles.slotsCard}>
        <View style={styles.slotsHeader}>
          <Text style={styles.slotsTitle}>Available Slots</Text>
          <TouchableOpacity onPress={handleFirstAvailable}>
            <Text style={styles.firstAvailableText}>First Available</Text>
          </TouchableOpacity>
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
                        ? "No slots left today"
                        : "Not available"}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {renderCalendar()}
      {renderAvailableSlots()}
      {(() => {
        const cardTitle = reschedule ? booking?.price?.title : sessionTitle;
        const cardDesc = reschedule
          ? booking?.price?.description
          : sessionDescription;
        const cardPrice = reschedule ? booking?.price?.price : sessionPrice;
        const hasPrice =
          cardPrice !== undefined &&
          cardPrice !== null &&
          String(cardPrice).trim() !== "";

        return (
          <View style={styles.sessionCard}>
            {!!cardTitle && (
              <Text style={styles.sessionTitle}>{cardTitle}</Text>
            )}
            {!!cardDesc && <Text style={styles.sessionDesc}>{cardDesc}</Text>}
            {(hasPrice || !!sessionPriceDesc) && (
              <View style={styles.sessionDetailsRow}>
                <Text style={styles.sessionPriceDesc}>{sessionPriceDesc}</Text>
                {hasPrice && (
                  <Text style={styles.sessionPrice}>${cardPrice}</Text>
                )}
              </View>
            )}
          </View>
        );
      })()}
      <TouchableOpacity
        style={[
          styles.continueButton,
          (!selectedDate || !selectedTime || selectedSlots.length === 0) && styles.continueButtonDisabled,
        ]}
        onPress={handleContinue}
        disabled={!selectedDate || !selectedTime || selectedSlots.length === 0}
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
    fontSize: 15  ,
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
