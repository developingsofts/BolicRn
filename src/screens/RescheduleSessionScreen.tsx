import React from "react";
import { StyleSheet } from "react-native";
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
  useGetUserBookingsQuery,
  useUpdateBookingMutation,
} from "../services/api/bookingApi";
import { Toast } from "../components/ToastManager";

const BOOKINGS_FETCH_LIMIT = 100;

const RescheduleSessionScreen = ({ navigation, route }: any) => {
  const currentBooking: BookingData | undefined = route.params?.booking;

  const trainerId = currentBooking?.trainer?.id
    ? String(currentBooking.trainer.id)
    : undefined;
  const [updateBooking] = useUpdateBookingMutation();

  const clientId = currentBooking?.user?.id;
  const { data: userBookingsData } = useGetUserBookingsQuery(
    {
      user_id: clientId ?? "",
      status: "upcomming",
      page: 1,
      limit: BOOKINGS_FETCH_LIMIT,
    },
    { skip: !clientId },
  );

  const sessionCount = React.useMemo(() => {
    const rows =
      userBookingsData && userBookingsData.status === true
        ? userBookingsData.data?.bookings ?? []
        : [];

    const matching = rows.filter(
      (b) =>
        b?.price?.id === currentBooking?.price?.id &&
        b?.trainer?.id === currentBooking?.trainer?.id,
    ).length;

    return Math.max(matching, 1);
  }, [userBookingsData, currentBooking?.price?.id, currentBooking?.trainer?.id]);

  const pricePerSession = currentBooking?.price?.price;
  const sessionPriceDesc =
    pricePerSession !== undefined && pricePerSession !== null
      ? `$${pricePerSession}/hr  x  ${sessionCount} ${
          sessionCount === 1 ? "hour" : "hours"
        }`
      : "";

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
        trainerId={trainerId}
        sessionPriceDesc={sessionPriceDesc}
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
