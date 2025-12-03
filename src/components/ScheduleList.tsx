import React from "react";
import { View } from "react-native";
import ScheduleCard from "./ScheduleCard";
import { BookingData, PriceInfo, TrainerInfo, UserInfo } from "../services/api/bookingApi";


interface ScheduleListProps {
  schedules: BookingData[];
  onMessage?: (user: UserInfo) => void;
  onRemove?: (scheduleId: number) => void;
}

const ScheduleList: React.FC<ScheduleListProps> = ({ schedules, onMessage,onRemove}) => {
  return (
    <View>
      {schedules.map((schedule) => (
        <ScheduleCard key={schedule.id} {...schedule} onMessage={onMessage} onRemove={onRemove && (() => onRemove(schedule.id))}/>
        
      ))}
    </View>
  );
};

export default ScheduleList;
