import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { COLORS, DIMENSIONS } from "../config/constants";
import FontWeight from "../hooks/useInterFonts";
import { r } from "../designing/responsiveDesigns";
import { LeftArrow } from "../../assets";

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

  // Session details
  sessionTitle?: string;
  sessionDescription?: string;
  sessionPriceDesc?: string;
  sessionPrice?: string;

  // Button props
  buttonText: string;
  onButtonPress: (selectedDate: string, selectedTime: string) => void;

  // Custom slot generation (optional)
  customDaySlots?: DaySlots[];
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
  sessionTitle = "Single Session",
  sessionDescription = "One-on-one personalized training session.",
  sessionPriceDesc = "$75/hr x 4 hours",
  sessionPrice = "$300",
  buttonText,
  onButtonPress,
  customDaySlots,
}) => {
  // Generate day slots for next 3 days (default behavior)
  const generateDefaultDaySlots = (): DaySlots[] => {
    const today = new Date();
    const slots: DaySlots[] = [];

    for (let i = 3; i < 6; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dateStr = date.toISOString().split("T")[0];
      const displayDate = date.getDate().toString().padStart(2, "0");
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const day = days[date.getDay()];

      let timeSlots: string[] = [];
      if (i === 3) {
        timeSlots = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM"];
      } else if (i === 4) {
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

  const daySlots = customDaySlots || generateDefaultDaySlots();
  const [selectedDate, setSelectedDate] = useState<string>(daySlots[0].date);
  const [selectedTime, setSelectedTime] = useState<string>(
    daySlots[0].slots[0]
  );

  // Get today's date for calendar min date
  const today = new Date().toISOString().split("T")[0];

  // Create marked dates for calendar
  const markedDates = {
    [selectedDate]: {
      selected: true,
      selectedColor: COLORS.primary,
    },
  };

  const handleDateSelect = (date: string, firstSlot: string) => {
    setSelectedDate(date);
    setSelectedTime(firstSlot);
  };

  const handleContinue = () => {
    onButtonPress(selectedDate, selectedTime);
  };

  const handleFirstAvailable = () => {
    setSelectedDate(daySlots[0].date);
    setSelectedTime(daySlots[0].slots[0]);
  };

  const renderCalendar = () => {
    // Get the month name from selected date
    const selectedDateObj = new Date(selectedDate);
    const monthName = selectedDateObj.toLocaleDateString("en-US", {
      month: "long",
    });

    return (
      <View style={styles.calendarCard}>
        <Text style={styles.calendarTitle}>{monthName}</Text>
        <Calendar
          current={selectedDate}
          minDate={today}
          onDayPress={(day: DateData) => {
            setSelectedDate(day.dateString);
          }}
          markedDates={markedDates}
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
            arrowColor: COLORS.primary,
            monthTextColor: COLORS.app_black,
            textDayFontFamily: FontWeight.Regular,
            textMonthFontFamily: FontWeight.SemiBold,
            textDayHeaderFontFamily: FontWeight.Medium,
            textDayFontSize: 14,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 12,
          }}
        />
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
          {daySlots.map((daySlot, dayIndex) => {
            const isSelectedDay = selectedDate === daySlot.date;

            return (
              <View key={dayIndex} style={styles.dayColumn}>
                {/* Date Header */}
                <TouchableOpacity
                  onPress={() => handleDateSelect(daySlot.date, daySlot.slots[0])}
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
                  const isSelected =
                    isSelectedDay && selectedTime === slot;

                  return (
                    <TouchableOpacity
                      key={slotIndex}
                      onPress={() => {
                        setSelectedDate(daySlot.date);
                        setSelectedTime(slot);
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
        <Text style={styles.sessionTitle}>{sessionTitle}</Text>
        <Text style={styles.sessionDesc}>{sessionDescription}</Text>
        <View style={styles.sessionDetailsRow}>
          <Text style={styles.sessionPriceDesc}>{sessionPriceDesc}</Text>
          <Text style={styles.sessionPrice}>{sessionPrice}</Text>
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
  calendarCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: DIMENSIONS.spacing.lg,
    marginTop: DIMENSIONS.spacing.lg,
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
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  sessionDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  sessionDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionPriceDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  sessionPrice: {
    fontSize: 22,
    fontWeight: '700',
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