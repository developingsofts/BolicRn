import React from "react";
import { View } from "react-native";
import BookingCard from "./BookingCard";

export interface Booking {
  id: string;
  guestName: string;
  guestInitial: string;
  date: string;
  timeRange: string;
  sessionType: string;
  price: number;
  onAccept?: () => void;
  onDecline?: () => void;
}

interface BookingListProps {
  bookings: Booking[];
}

const BookingList: React.FC<BookingListProps> = ({ bookings }) => {
  return (
    <View>
      {bookings.map((booking) => (
        <BookingCard key={booking.id} {...booking} />
      ))}
    </View>
  );
};

export default BookingList;
