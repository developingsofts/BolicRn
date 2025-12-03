import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BasicTopBar from "../components/BasicTopBar";
import DateTimeSelector from "../components/DateTimeSelector";
import {
  COLORS,
  convertBookingDateTommddyyyyFormat,
  DIMENSIONS,
  toUtc,
} from "../config/constants";
import {
  BookingData,
  useUpdateBookingMutation,
} from "../services/api/bookingApi";
import { Toast } from "../components/ToastManager";

interface DaySlots {
  date: string;
  displayDate: string;
  day: string;
  slots: string[];
}

// Convert date format from "Wednesday - Dec 10, 2025" to "mm/dd/yyyy"

const RescheduleSessionScreen = ({ navigation, route }: any) => {
  // Create custom day slots matching the original hardcoded data
  const customDaySlots: DaySlots[] = [
    {
      date: "2025-10-14",
      displayDate: "14",
      day: "Sun",
      slots: ["9:00 AM", "2:00 PM", "7:00 PM"],
    },
    {
      date: "2025-10-15",
      displayDate: "15",
      day: "Mon",
      slots: ["9:00 AM", "2:00 PM", "7:00 PM"],
    },
    {
      date: "2025-10-16",
      displayDate: "16",
      day: "Tue",
      slots: ["9:00 AM", "2:00 PM", "7:00 PM"],
    },
  ];

  const currentBooking = route.params?.booking;
  const [updateBooking, { isLoading: isUpdating }] = useUpdateBookingMutation();

  const handleUpdate = async (booking: BookingData) => {
    try {
      if (!booking || !booking.id) {
        Toast.error("Invalid booking data");
        return;
      }

      const formattedDate = convertBookingDateTommddyyyyFormat(booking.date);

      const updateData = {
        id: booking.id,
        price_id: booking.price.id.toString(),
        date: formattedDate,
        time: toUtc(booking.time),
        status: booking.status as "upcomming" ,
      };

      const response = await updateBooking(updateData).unwrap();

      if (response && response.status) {
        Toast.success("Booking rescheduled successfully");
        console.log("Booking updated:", response.data);
        navigation.goBack?.();
      } else {
        Toast.error(response.message);
      }
    } catch (error: any) {
      console.error("Error updating booking:", error);
      Toast.error(error.toString());
    }
  };

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <BasicTopBar
        onBackPress={() => navigation.goBack?.()}
        title="Reschedule Session"
        subtitle="You can reschedule before last day."
        containerStyle={{
          paddingTop: DIMENSIONS.spacing.xxl,
          paddingBottom: DIMENSIONS.spacing.lg,
        }}
      />
      <DateTimeSelector
        navigation={navigation}
        buttonText="Update"
        onUpdateBooking={handleUpdate}
        customDaySlots={customDaySlots}
        reschedule={true}
        booking={currentBooking}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});

export default RescheduleSessionScreen;
