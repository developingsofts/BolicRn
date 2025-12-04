import React, { use, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { Image } from "react-native";
import { ScheduleClose, ScheduleChat } from "../../assets";
import { PriceInfo, TrainerInfo, UserInfo } from "../services/api/bookingApi";
import { addOneHourToTime, COLORS, toLocalTime } from "../config/constants";
import ConfirmDialog from "./ConfirmDialog";
import FontWeight from "../hooks/useInterFonts";

interface ScheduleCardProps {
  id: number;
  trainer: TrainerInfo;
  user: UserInfo;
  date: string; // ISO format: "2025-12-10T00:00:00.000Z"
  time: string; // e.g., "10:00AM"
  price: PriceInfo;
  status: "upcomming" | "completed" | "canceled";
  onRemove?: () => void;
  onMessage?: (user: UserInfo) => void;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({
  id,
  trainer,
  user,
  date,
  time,
  price,
  status,
  onRemove,
  onMessage,
}) => {
  const localtime = toLocalTime(time);
  const localEndTime = addOneHourToTime(localtime);
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
      <Text style={styles.title}>Today’s Schedule</Text>
      <View style={styles.row}>
        <View style={styles.infoSection}>
          {/* Time Section */}
          <View style={styles.timeSection}>
            <Text style={styles.startTime}>{localtime}</Text>
            <Text style={styles.endTime}>{localEndTime}</Text>
          </View>
          {/* Divider */}
          <View style={styles.verticalDivider} />
          {/* Client Info Section */}
          <View style={styles.clientSection}>
            <Text style={styles.clientName}>{user.name}</Text>
            <Text style={styles.sessionType}>{price.title}</Text>
          </View>
        </View>
        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.iconBtn, styles.removeBtn]}
            onPress={handleDecline}
          >
            <Image source={ScheduleClose} style={styles.actionIcon}  />
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity
            style={[styles.iconBtn, styles.messageBtn]}
            onPress={() => onMessage && onMessage(user)}
          >
            <Image source={ScheduleChat} style={styles.actionIcon} />
          </TouchableOpacity>
        </View>
      </View>
      <ConfirmDialog
        visible={showDeclineDialog}
        onClose={() => setShowDeclineDialog(false)}
        onConfirm={handleDeclineConfirm}
        title="Decline Client Request"
        description={`Confirm if you wish to decline upcoming client session request for the time ${localtime}.

Client will be notified and refund will be initiated.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.app_black,
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
    minWidth: 0,
  },
  timeSection: {
    flexDirection: "column",
  },
  startTime: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.primary,
  },
  endTime: {
    fontSize: 14,
    color: COLORS._5E5E5E,
    fontFamily: FontWeight.Regular,
    textAlign: "right",
  },
  clientSection: {
    flexDirection: "column",
    flex: 1,
    minWidth: 0,
  },
  verticalDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS._BFDEFF,
    alignSelf: "center",
    flexShrink: 0,
  },
  clientName: {
    fontFamily: FontWeight.SemiBold,
    fontSize: 16,
    color: COLORS.gradient1,
    flexWrap: "wrap",
  },
  sessionType: {
    fontSize: 14,
    color: COLORS._5E5E5E,
    fontFamily: FontWeight.Regular,
    flexWrap: "wrap",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 12,
    flexShrink: 0,
  },
  iconBtn: {
    height: 36,
    width: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  actionDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
  },
  removeBtn: {},
  messageBtn: {},
  actionIcon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
});

export default ScheduleCard;
