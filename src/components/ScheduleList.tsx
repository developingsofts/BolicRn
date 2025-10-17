import React from "react";
import { View } from "react-native";
import ScheduleCard from "./ScheduleCard";

export interface Schedule {
  id: string;
  startTime: string;
  endTime: string;
  clientName: string;
  sessionType: string;
  onRemove?: () => void;
  onMessage?: () => void;
}

interface ScheduleListProps {
  schedules: Schedule[];
}

const ScheduleList: React.FC<ScheduleListProps> = ({ schedules }) => {
  return (
    <View>
      {schedules.map((schedule) => (
        <ScheduleCard key={schedule.id} {...schedule} />
      ))}
    </View>
  );
};

export default ScheduleList;
