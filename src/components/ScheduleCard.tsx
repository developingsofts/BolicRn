import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "react-native";
import { ScheduleClose, ScheduleChat } from "../../assets";

interface ScheduleCardProps {
  startTime: string;
  endTime: string;
  clientName: string;
  sessionType: string;
  onRemove?: () => void;
  onMessage?: () => void;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({
  startTime,
  endTime,
  clientName,
  sessionType,
  onRemove,
  onMessage,
}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Today’s Schedule</Text>
      <View style={styles.row}>
        <View style={styles.infoSection}>
          {/* Time Section */}
          <View style={styles.timeSection}>
            <Text style={styles.startTime}>{startTime}</Text>
            <Text style={styles.endTime}>{endTime}</Text>
          </View>
          {/* Divider */}
          <View style={styles.verticalDivider} />
          {/* Client Info Section */}
          <View style={styles.clientSection}>
            <Text style={styles.clientName}>{clientName}</Text>
            <Text style={styles.sessionType}>{sessionType}</Text>
          </View>
        </View>
        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.iconBtn, styles.removeBtn]}
            onPress={onRemove}
          >
            <Image source={ScheduleClose} style={styles.actionIcon} />
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity
            style={[styles.iconBtn, styles.messageBtn]}
            onPress={onMessage}
          >
            <Image source={ScheduleChat} style={styles.actionIcon} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    title:{
    fontSize: 16,
    fontWeight: '600',
    color: '#51515',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,

  },
  timeSection: {
    flexDirection: 'column',
  },
  startTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2563eb',
  },
  endTime: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'right',
  },
  clientSection: {
    flexDirection: 'column',
  },
  verticalDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
  },
  clientName: {
    fontWeight: '600',
    fontSize: 15,
    color: '#222',
  },
  sessionType: {
    fontSize: 13,
    color: '#6B7280',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    height: 32,
    width: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
    alignSelf: 'center',
  },
  removeBtn: {

  },
  messageBtn: {

  },
  actionIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
});

export default ScheduleCard;
