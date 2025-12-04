import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS } from "../config/constants";
import FontWeight from "../hooks/useInterFonts";
import ConfirmDialog from "./ConfirmDialog";
import { BookingData } from "../services/api/bookingApi";

interface MyBookingCardProps {
  id: string;
  sessionType: string;
  date: string;
  timeRange: string;
  clientName: string;
  clientInitial: string;
  booking: BookingData;
  onDecline?: (clientName: string) => void;
  onReschedule?: (clientName: string) => void;
  hideActions?: boolean;
  navigation?: any;
}

const MyBookingCard = ({
  id,
  sessionType,
  date,
  timeRange,
  clientName,
  clientInitial,
  booking,
  onDecline,
  onReschedule,
  hideActions,
  navigation,
}: MyBookingCardProps) => {
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [dateTimeHeight, setDateTimeHeight] = useState(0);

  const handleDecline = () => {
    setShowDeclineDialog(true);
  };

  const handleDeclineConfirm = () => {
    setShowDeclineDialog(false);
    if (onDecline) onDecline(clientName);
  };

  const handleReschedule = () => {
    if (navigation && typeof navigation.navigate === "function") {
      console.log(
        "Navigating to RescheduleSessionScreen with bookingId:",
        clientName
      );
      if (booking) {
        navigation.navigate("RescheduleSession", {
          booking,
        });
      }
    } else if (onReschedule) {
      onReschedule(clientName);
    } else {
      alert(`Booking with ${clientName} has been rescheduled`);
    }
  };

  return (
    <View style={styles.card}>
      {/* Session Type/Title at the top */}
      <Text style={styles.sessionType}>{sessionType}</Text>
      {/* Top Row: Date, Time, and Client/Badge with Separator */}
      <View style={styles.topRow}>
        <View
          style={styles.dateTimeCol}
          onLayout={(event) => {
            setDateTimeHeight(event.nativeEvent.layout.height);
          }}
        >
          <Text style={styles.date} numberOfLines={1} ellipsizeMode="tail">
            {date}
          </Text>
          <Text style={styles.timeRange} numberOfLines={1} ellipsizeMode="tail">
            {timeRange}
          </Text>
        </View>
        <View style={[styles.verticalSeparator, { height: dateTimeHeight }]} />
        <View style={styles.clientBadgeCol}>
          <View style={styles.clientTextCol}>
            <Text style={styles.clientLabel}>Client</Text>
            <Text style={styles.clientName}>{clientName}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{clientInitial}</Text>
          </View>
        </View>
      </View>
      {/* Actions */}
      {!hideActions && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={handleDecline}
          >
            <Text style={[styles.actionButtonText, styles.declineButtonText]}>
              Decline
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rescheduleButton]}
            onPress={handleReschedule}
          >
            <Text
              style={[styles.actionButtonText, styles.rescheduleButtonText]}
            >
              Rescheduled
            </Text>
          </TouchableOpacity>
        </View>
      )}
      <ConfirmDialog
        visible={showDeclineDialog}
        onClose={() => setShowDeclineDialog(false)}
        onConfirm={handleDeclineConfirm}
        title="Decline Client Request"
        description={`Confirm if you wish to decline upcoming client session request for the ${date} ${timeRange}.

Client will be notified and refund will be initiated.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 15,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#6B6B6B",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    marginBottom: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    justifyContent: "space-between",
    width: "100%",
  },
  dateTimeCol: {
    marginRight: 12,
  },
  date: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.gradient1,
    marginBottom: 2,
  },
  timeRange: {
    fontSize: 14,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.primary,
    marginBottom: 2,
  },
  separatorContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  verticalSeparator: {
    width: 1,
    backgroundColor: COLORS._BFDEFF,
    marginHorizontal: 12,
  },
  badgeCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  clientBadgeCol: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    flex: 1,
    marginLeft: 2,
  },
  clientTextCol: {
    flexDirection: "column",
    justifyContent: "center",
    flex: 1,
    minWidth: 0,
  },
  clientLabel: {
    fontSize: 12,
    color: COLORS._5E5E5E,
    textAlign: "right",
    fontFamily: FontWeight.Medium,
  },
  clientName: {
    fontSize: 16,
    color: COLORS.gradient1,
    fontFamily: FontWeight.SemiBold,
    textAlign: "right",
    flexWrap: "wrap",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    color: COLORS.white,
    fontFamily: FontWeight.SemiBold,
    fontSize: 18,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  declineButton: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.white,
    boxShadow: "0px 0px 12px 0px #76767626",
  },
  declineButtonText: {
    color: COLORS._EB3434,
  },
  rescheduleButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  rescheduleButtonText: {
    color: COLORS.white,
  },
  actionButtonText: {
    fontFamily: FontWeight.Medium,
    fontSize: 14,
  },
  sessionType: {
    fontSize: 14,
    fontFamily: FontWeight.Regular,
    color: COLORS._5E5E5E,
    marginBottom: 5,
  },
});

export default MyBookingCard;
