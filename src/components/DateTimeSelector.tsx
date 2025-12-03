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
  // Navigation props
  navigation: any;
  onBackPress?: () => void;

  // Header props (optional - for backward compatibility)
  title?: string;
  subtitle?: string;

  // Trainer/Package info (optional)
  trainerName?: string;
  packageTitle?: string;
  price?: number;
  trainerId?: string;
  description?: string;
  // Session details
  sessionTitle?: string;
  sessionDescription?: string;
  sessionPriceDesc?: string;
  sessionPrice?: string;

  // Button props
  buttonText: string;
  onButtonPress?: (
    selectedDate: string,
    selectedTime: string,
    selectedSlots?: { date: string; time: string }[]
  ) => void;

  onUpdateBooking?: (booking: BookingData) => void;

  // Custom slot generation (optional)
  customDaySlots?: DaySlots[];

  // Multiple slot selection
  allowMultipleSlots?: boolean;
  reschedule?: boolean;
  booking?: BookingData;
}

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
  sessionPriceDesc = "$75/hr x 4 hours",
  sessionPrice = "300",
  buttonText,
  onButtonPress,
  onUpdateBooking,
  customDaySlots,
  allowMultipleSlots = false,
  reschedule = false,
  booking,
}) => {
  // Get today's date for calendar min date
  const today = new Date().toISOString().split("T")[0];

  console.log("Received booking:", booking);

  // Helper function to normalize day names to full names
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

  // Generate day slots for next 3 days (default behavior)
  const generateDefaultDaySlots = (): DaySlots[] => {
    const todayDate = new Date();
    const slots: DaySlots[] = [];

    for (let i = 0; i < 3; i++) {
      const date = new Date(todayDate);
      date.setDate(todayDate.getDate() + i);

      const dateStr = date.toISOString().split("T")[0];
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
        slots: timeSlots,
      });
    }

    return slots;
  };

  // Function to generate slots based on a reference date (selected date + 2 more days)
  // But only show dates within the same month
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

      // Stop if we've moved to a different month
      if (date.getMonth() !== refMonth || date.getFullYear() !== refYear) {
        break;
      }

      const dateStr = date.toISOString().split("T")[0];
      const displayDate = date.getDate().toString().padStart(2, "0");
      const dayName = daysOfWeek[date.getDay()];

      // Get hourly slots from API data for this day
      let timeSlots: string[] = [];

      if (
        slotsByDay[dayName] &&
        slotsByDay[dayName].start_time &&
        slotsByDay[dayName].end_time
      ) {
        // Generate hourly slots from API availability
        timeSlots = generateHourlySlots(
          slotsByDay[dayName].start_time,
          slotsByDay[dayName].end_time
        );
      } else {
        // Fallback to default slots if no API data
        if (i === 0) {
          timeSlots = [
            "9:00 AM",
            "10:00 AM",
            "11:00 AM",
            "12:00 PM",
            "1:00 PM",
          ];
        } else if (i === 1) {
          timeSlots = ["2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM"];
        } else {
          timeSlots = ["7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM", "11:00 PM"];
        }
      }

      slots.push({
        date: dateStr,
        displayDate,
        day: dayName,
        slots: timeSlots,
      });
    }

    return slots;
  };

  const initialDaySlots = customDaySlots || generateDefaultDaySlots();

  // Extract date and time from booking if reschedule is true
  let defaultDate = today;
  let defaultTime = "09:00 AM";

  if (reschedule && booking && booking.date && booking.time) {
    // Parse the booking date (format: "Wednesday - Dec 10, 2025")
    const dateMatch = booking.date.match(/(\w+)\s*-\s*(\w+)\s+(\d+),\s*(\d+)/);
    if (dateMatch) {
      const monthStr = dateMatch[2]; // "Dec"
      const dayStr = dateMatch[3]; // "10"
      const yearStr = dateMatch[4]; // "2025"

      // Convert to ISO format
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

    // Use booking time as default
    defaultTime = booking.time || "09:00 AM";

    console.log(
      "[DateTimeSelector] Reschedule mode - Pre-selecting booking date:",
      defaultDate,
      "time:",
      defaultTime
    );
  } else {
    // Find today's slots or default to first available
    const todaySlot = initialDaySlots.find((slot) => slot.date === today);
    defaultTime = todaySlot
      ? todaySlot.slots[0]
      : initialDaySlots[0]?.slots[0] || "09:00 AM";
  }

  const [calendarSelectedDate, setCalendarSelectedDate] =
    useState<string>(defaultDate);
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);
  const [selectedTime, setSelectedTime] = useState<string>(defaultTime);
  const [selectedSlots, setSelectedSlots] = useState<
    { date: string; time: string }[]
  >([{ date: defaultDate, time: defaultTime }]);
  const [slotsByDay, setSlotsByDay] = useState<{
    [key: string]: { start_time: string; end_time: string };
  }>({
    Sunday: { start_time: "09:00 AM", end_time: "05:00 PM" },
    Monday: { start_time: "09:00 AM", end_time: "05:00 PM" },
    Tuesday: { start_time: "09:00 AM", end_time: "05:00 PM" },
    Wednesday: { start_time: "09:00 AM", end_time: "05:00 PM" },
    Thursday: { start_time: "09:00 AM", end_time: "05:00 PM" },
    Friday: { start_time: "09:00 AM", end_time: "05:00 PM" },
    Saturday: { start_time: "09:00 AM", end_time: "05:00 PM" },
  });
  const [isInitialMount, setIsInitialMount] = useState(!reschedule);

  // Fetch availability slots from API
  const { data: availabilityData, isLoading: isLoadingAvailability } =
    useGetAvailabilityQuery(trainerId ? { trainerId } : { trainerId: "" }, {
      skip: !trainerId,
    });

  // Helper function to convert 12-hour time to minutes
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

  // Helper function to convert minutes to 12-hour time
  const minutesToTime = (mins: number): string => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")} ${ampm}`;
  };

  // Generate hourly slots from start and end time
  const generateHourlySlots = (
    startTime: string,
    endTime: string
  ): string[] => {
    const slots: string[] = [];
    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);

    console.log(
      `[generateHourlySlots] Start: ${startTime} (${startMins}), End: ${endTime} (${endMins})`
    );

    for (let mins = startMins; mins < endMins; mins += 60) {
      slots.push(minutesToTime(mins));
    }

    console.log(`[generateHourlySlots] Generated slots:`, slots);
    return slots;
  };

  // Convert API availability to time slots
  useEffect(() => {
    if (availabilityData && availabilityData.status && availabilityData.data) {
      console.log(
        "[DateTimeSelector] Availability Data:",
        availabilityData.data
      );

      // Get available slots from API
      const slots = availabilityData.data[0]?.slots || [];
      console.log("[DateTimeSelector] Available Slots from API:", slots);

      // Map slots by day
      const daySlots: {
        [key: string]: { start_time: string; end_time: string };
      } = {};
      const daysOfWeek = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];

      // Initialize all days with default times
      daysOfWeek.forEach((day) => {
        daySlots[day] = { start_time: "09:00 AM", end_time: "05:00 PM" };
      });

      // Override with API data if available
      slots.forEach((slot) => {
        if (slot.day && slot.start_time && slot.end_time) {
          // Normalize day name to full name
          const normalizedDay = normalizeDayName(slot.day);
          // Convert UTC times to local timezone for display
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
      console.log("[DateTimeSelector] Slots by Day (with defaults):", daySlots);
      setSlotsByDay(daySlots);
    } else if (availabilityData && !availabilityData.status) {
      // If API returns but with no data, set default times for all days
      console.log("[DateTimeSelector] No availability data, using defaults");
      const daySlots: {
        [key: string]: { start_time: string; end_time: string };
      } = {};
      const daysOfWeek = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      daysOfWeek.forEach((day) => {
        daySlots[day] = { start_time: "09:00 AM", end_time: "05:00 PM" };
      });
      setSlotsByDay(daySlots);
    }
  }, [availabilityData]);

  // Generate display slots based on calendar-selected date (only changes when calendar is clicked)
  const displayedSlots = generateSlotsFromDate(calendarSelectedDate);

  // Auto-select first slot only on initial mount (unless reschedule mode)
  useEffect(() => {
    if (
      displayedSlots &&
      displayedSlots.length > 0 &&
      displayedSlots[0].slots.length > 0
    ) {
      // In reschedule mode, the pre-selected date/time from booking is already set
      // Skip auto-selection to preserve the booking's current date/time
      if (isInitialMount && !reschedule) {
        const firstDate = displayedSlots[0].date;
        const firstSlot = displayedSlots[0].slots[0];
        console.log(
          "[DateTimeSelector] Initial mount - Auto-selecting first slot:",
          firstSlot,
          "on date:",
          firstDate
        );
        setSelectedDate(firstDate);
        setSelectedTime(firstSlot);
        setSelectedSlots([{ date: firstDate, time: firstSlot }]);
        setIsInitialMount(false);
      } else if (reschedule) {
        // In reschedule mode, mark initial mount as done to prevent re-renders from triggering selection changes
        setIsInitialMount(false);
      }
    }
  }, [isInitialMount]);

  // Create marked dates for calendar
  const markedDates = {
    [calendarSelectedDate]: {
      selected: true,
      selectedColor: COLORS.primary,
    },
  };

  const handleCalendarDateSelect = (date: string) => {
    setCalendarSelectedDate(date);

    // Find the first slot for this date
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

    // Generate slots for the selected date
    let firstTimeSlot = "09:00 AM";
    if (
      slotsByDay[dayName] &&
      slotsByDay[dayName].start_time &&
      slotsByDay[dayName].end_time
    ) {
      const slots = generateHourlySlots(
        slotsByDay[dayName].start_time,
        slotsByDay[dayName].end_time
      );
      firstTimeSlot = slots.length > 0 ? slots[0] : "09:00 AM";
    }

    // Update selected date and time with first slot, clear previous slots
    setSelectedDate(date);
    setSelectedTime(firstTimeSlot);
    setSelectedSlots([{ date, time: firstTimeSlot }]);

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
      // Multiple slot selection mode
      const slotKey = `${date}-${time}`;
      const isAlreadySelected = selectedSlots.some(
        (slot) => slot.date === date && slot.time === time
      );

      // Check if this is a different date than the first selected slot
      const firstSelectedDate = selectedSlots[0]?.date;
      const isDifferentDate = date !== firstSelectedDate;

      if (isAlreadySelected) {
        // Remove the slot if already selected
        const filtered = selectedSlots.filter(
          (slot) => !(slot.date === date && slot.time === time)
        );
        setSelectedSlots(filtered.length > 0 ? filtered : [{ date, time }]);
        setSelectedDate(filtered.length > 0 ? filtered[0].date : date);
        setSelectedTime(filtered.length > 0 ? filtered[0].time : time);
        console.log("[handleTimeSlotSelect] Removed slot:", slotKey);
      } else if (isDifferentDate) {
        // If selecting a slot from a different date, clear previous slots and start fresh
        setSelectedSlots([{ date, time }]);
        setSelectedDate(date);
        setSelectedTime(time);
        console.log(
          "[handleTimeSlotSelect] Switched to different date, cleared previous slots. New slot:",
          slotKey
        );
      } else {
        // Add the slot (same date)
        setSelectedSlots([...selectedSlots, { date, time }]);
        setSelectedDate(date);
        setSelectedTime(time);
        console.log("[handleTimeSlotSelect] Added slot:", slotKey);
      }
    } else {
      // Single slot selection mode (default)
      setSelectedDate(date);
      setSelectedTime(time);
      setSelectedSlots([{ date, time }]);
    }
  };

  const handleContinue = () => {
    if (reschedule) {
      // Update booking with newly selected date and time
      const updatedBooking = {
        ...booking,
        date: selectedDate,
        time: selectedTime,
      } as BookingData;
      updatedBooking && onUpdateBooking && onUpdateBooking(updatedBooking);
    } else {
      if (allowMultipleSlots) {
        // Pass all selected slots along with the first slot's date/time for backward compatibility
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
    // Get the month name from selected date
    const selectedDateObj = new Date(selectedDate);
    const monthName = selectedDateObj.toLocaleDateString("en-US", {
      month: "long",
    });

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
              backgroundColor: COLORS.white,
              calendarBackground: COLORS.white,
              textSectionTitleColor: COLORS._5E5E5E,
              selectedDayBackgroundColor: COLORS.primary,
              selectedDayTextColor: COLORS.white,
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

            return (
              <View key={dayIndex} style={styles.dayColumn}>
                {/* Date Header - Shows info, clicking updates selected time only */}
                <TouchableOpacity
                  onPress={() =>
                    handleTimeSlotSelect(daySlot.date, daySlot.slots[0])
                  }
                  style={[
                    styles.dateButton,
                    isSelectedDay && styles.dateButtonSelected,
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

                {/* Time Slots */}
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
      <View style={styles.sessionCard}>
        <Text style={styles.sessionTitle}>
          {reschedule ? booking?.price?.title : sessionTitle}
        </Text>
        <Text style={styles.sessionDesc}>
          {reschedule ? booking?.price?.description : sessionDescription}
        </Text>
        <View style={styles.sessionDetailsRow}>
          <Text style={styles.sessionPriceDesc}>{sessionPriceDesc}</Text>
          <Text style={styles.sessionPrice}>
            ${reschedule ? booking?.price?.price : sessionPrice}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[
          styles.continueButton,
          (!selectedDate || !selectedTime) && styles.continueButtonDisabled,
        ]}
        onPress={handleContinue}
        disabled={!selectedDate || !selectedTime}
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
    backgroundColor: COLORS.white,
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
    color: COLORS.app_black,
    marginBottom: DIMENSIONS.spacing.md,
  },
  slotsCard: {
    backgroundColor: COLORS.white,
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
    marginBottom: DIMENSIONS.spacing.lg,
  },
  slotsTitle: {
    fontFamily: FontWeight.Bold,
    fontSize: 18,
    color: COLORS.app_black,
  },
  firstAvailableText: {
    fontFamily: FontWeight.SemiBold,
    fontSize: 14,
    color: COLORS.primary,
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
    padding: DIMENSIONS.spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  dateButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  dateNumber: {
    fontFamily: FontWeight.Bold,
    fontSize: 24,
    color: COLORS.app_black,
  },
  dateNumberSelected: {
    color: COLORS.white,
  },
  dateDay: {
    fontFamily: FontWeight.Medium,
    fontSize: 12,
    color: COLORS._5E5E5E,
    marginTop: 2,
  },
  dateDaySelected: {
    color: COLORS.white,
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
    fontFamily: FontWeight.Medium,
    fontSize: 14,
    color: COLORS.app_black,
  },
  timeSlotTextSelected: {
    color: COLORS.white,
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
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
  },
  sessionDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  sessionDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sessionPriceDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  sessionPrice: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.primary,
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: DIMENSIONS.spacing.md,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS._D9D9D9,
  },
  continueButtonText: {
    fontFamily: FontWeight.SemiBold,
    fontSize: 16,
    color: COLORS.white,
  },
});

export default DateTimeSelector;
