import React, { use, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "react-native";
import ConfirmDialog from "./ConfirmDialog";
import { PriceInfo, TrainerInfo, UserInfo } from "../services/api/bookingApi";
import { formatUTCToDisplayDateTime } from "../config/constants";

interface BookingCardProps {
  id: number;
  trainer: TrainerInfo;
  user: UserInfo;
  date: string; // ISO format: "2025-12-10T00:00:00.000Z"
  time: string; // e.g., "10:00AM"
  price: PriceInfo;
  status: "upcomming" | "completed" | "canceled";
  onAccept?: () => void;
  onRemove?: () => void;
}

const BookingCard: React.FC<BookingCardProps> = ({
  id,
  trainer,
  user,
  date,
  time,
  price,
  status,
  onAccept,
  onRemove,
}) => {

  const {date: localDate, time: localTime} = formatUTCToDisplayDateTime(date,time)
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);

  const handleDecline = () => {
    setShowDeclineDialog(true);
  };

  const handleDeclineConfirm = () => {
    setShowDeclineDialog(false);
    if (onRemove) onRemove();
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.name.toString().charAt(0)}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.guestName}>{user.name}</Text>
          <Text style={styles.mutedText}>{localDate}</Text>
          <Text style={styles.mutedText}>{localTime}</Text>
        </View>
      </View>
      <View style={styles.sessionRow}>
        <Text style={styles.sessionType}>{price.title}</Text>
        <Text style={styles.price}>${price.price}</Text>
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.declineButton]}
          onPress={handleDecline}
        >
          <Text style={styles.declineText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.acceptButton]}
          onPress={onAccept}
        >
          <Text style={styles.acceptText}>Accept</Text>
        </TouchableOpacity>
      </View>
      <ConfirmDialog
        visible={showDeclineDialog}
        onClose={() => setShowDeclineDialog(false)}
        onConfirm={handleDeclineConfirm}
        title="Decline Client Request"
        description={`Confirm if you wish to decline upcoming client session request for the ${date} ${time}.

Client will be notified and refund will be initiated.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 18,
  },
  headerInfo: {
    flex: 1,
  },
  guestName: {
    fontWeight: "600",
    fontSize: 16,
    color: "#222",
  },
  mutedText: {
    color: "#6B7280",
    fontSize: 13,
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sessionType: {
    color: "#6B7280",
    fontSize: 14,
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2563eb",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  declineButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  acceptButton: {
    backgroundColor: "#22c55e",
  },
  declineText: {
    color: "#ef4444",
    fontWeight: "600",
  },
  acceptText: {
    color: "#fff",
    fontWeight: "600",
  },
});

export default BookingCard;
