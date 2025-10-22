import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS } from "../config/constants";
import FontWeight from "../hooks/useInterFonts";
import ConfirmDialog from "./ConfirmDialog";

interface MyBookingCardProps {
  id: string;
  sessionType: string;
  date: string;
  timeRange: string;
  clientName: string;
  clientInitial: string;
  onDecline?: (clientName: string) => void;
  onReschedule?: (clientName: string) => void;
  hideActions?: boolean;
  navigation?: any;
}

const MyBookingCard = ({
  sessionType,
  date,
  timeRange,
  clientName,
  clientInitial,
  onDecline,
  onReschedule,
  hideActions,
  navigation,
}: MyBookingCardProps) => {
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);

  const handleDecline = () => {
    setShowDeclineDialog(true);
  };

  const handleDeclineConfirm = () => {
    setShowDeclineDialog(false);
    if (onDecline) onDecline(clientName);
  };

  const handleReschedule = () => {
    if (navigation && typeof navigation.navigate === 'function') {
      navigation.navigate('RescheduleSession');
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
        <View style={styles.dateTimeCol}>
          <Text style={styles.date} numberOfLines={1} ellipsizeMode="tail">
            {date}
          </Text>
          <Text style={styles.timeRange} numberOfLines={1} ellipsizeMode="tail">
            {timeRange}
          </Text>
        </View>
        <View style={styles.verticalSeparator} />
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
            <Text style={[styles.actionButtonText, styles.rescheduleButtonText]}>
              Reschedule
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
        confirmText="Decline"
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
    padding: 24,
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
    marginBottom: 10,
    width: "100%",

  },
  dateTimeCol: {

  },
  date: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 2,
  },
  timeRange: {
    fontSize: 15,
    color: COLORS.primary,
    marginBottom: 2,
 
  },
  verticalSeparator: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
    marginHorizontal: 12,
    borderRadius: 1,
  },
  badgeCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  clientBadgeCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  clientTextCol: {
    flexDirection: "column",
    justifyContent: "center",
  },
  clientLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  clientName: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: "500",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  avatarText: {
    color: COLORS.white,
    fontFamily: FontWeight.SemiBold,
    fontSize: 16,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  declineButton: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.white,
    boxShadow: "0px 0px 12px 0px #76767626"
  },
  declineButtonText: {
    color: COLORS._FF1616,
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
    fontSize: 15,
  },
  sessionType: {
    fontSize: 14,
    fontWeight: "400",
    color: COLORS._5E5E5E,
    marginBottom: 10,
  },
});

export default MyBookingCard;
