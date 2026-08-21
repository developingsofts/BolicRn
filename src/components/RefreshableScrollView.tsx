import React from "react";
import { ScrollView, RefreshControl, ScrollViewProps } from "react-native";
import { COLORS } from "../config/constants";

export const REFRESH_INDICATOR_PROPS: {
  tintColor: string;
  colors: string[];
  progressBackgroundColor: string;
} = {
  tintColor: COLORS.primary,
  colors: [COLORS.primary],
  progressBackgroundColor: COLORS.surface,
};

interface RefreshableScrollViewProps extends ScrollViewProps {
  refreshing: boolean;
  onRefresh: () => void;
  children: React.ReactNode;
}

const RefreshableScrollView: React.FC<RefreshableScrollViewProps> = ({
  refreshing,
  onRefresh,
  children,
  ...props
}) => {
  return (
    <ScrollView
      {...props}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          {...REFRESH_INDICATOR_PROPS}
        />
      }
    >
      {children}
    </ScrollView>
  );
};

export default RefreshableScrollView;
