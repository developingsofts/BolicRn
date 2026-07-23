import React from "react";
import { View } from "react-native";
import BookingCard from "./BookingCard";
import {
  BookingData,
  PriceInfo,
  TrainerInfo,
  UserInfo,
} from "../services/api/bookingApi";

interface BookingListProps {
  bookings: BookingData[];
  onRemove?: (id: number) => void;
  onAccept?: (id: number) => void;
}

const BookingList: React.FC<BookingListProps> = ({
  bookings,
  onRemove,
  onAccept,
}) => {
  return (
    <View>
      {bookings.map((booking) => (
        <BookingCard
          key={booking.id}
          {...booking}
          onRemove={() => onRemove && onRemove(booking.id)}
          onAccept={() => onAccept && onAccept(booking.id)}
        />
      ))}
    </View>
  );
};

export default BookingList;
