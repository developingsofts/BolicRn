import React from "react";
import { View } from "react-native";
import BookingCard from "./BookingCard";
import {
  BookingData,
  PriceInfo,
  TrainerInfo,
  UserInfo,
} from "../services/api/bookingApi";

// export interface Booking {
//   id: number;
//   trainer: TrainerInfo;
//   user: UserInfo;
//   date: string; // ISO format: "2025-12-10T00:00:00.000Z"
//   time: string; // e.g., "10:00AM"
//   price: PriceInfo;
//   status: "upcomming" | "completed" | "cancelled";
//   onAccept?: () => void;
//   onDecline?: () => void;
// }

interface BookingListProps {
  bookings: BookingData[];
  onRemove?: (id: number) => void;
}

const BookingList: React.FC<BookingListProps> = ({ bookings, onRemove }) => {
  return (
    <View>
      {bookings.map((booking) => (
        <BookingCard key={booking.id} {...booking}  onRemove={() => onRemove && onRemove(booking.id)}/>
      ))}
    </View>
  );
};

export default BookingList;
