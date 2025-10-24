import React from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Text,
} from "react-native";
import DateTimeSelector from "../components/DateTimeSelector";
import { COLORS, DIMENSIONS } from "../config/constants";
import FontWeight from "../hooks/useInterFonts";
import { LeftArrow } from "../../assets";

interface SelectDateTimeScreenProps {
  navigation: any;
  route?: {
    params?: {
      trainerId?: string;
      trainerName?: string;
      packageTitle?: string;
      price?: number;
    };
  };
}

const SelectDateTimeScreen: React.FC<SelectDateTimeScreenProps> = ({
  navigation,
  route,
}) => {
  const trainerName = route?.params?.trainerName || "Alex";
  const packageTitle = route?.params?.packageTitle || "Training Session";
  const price = route?.params?.price || 0;
  const trainerId = route?.params?.trainerId;

  const handleContinue = (selectedDate: string, selectedTime: string) => {
    console.log("Selected:", selectedDate, selectedTime);
    // Navigate to confirmation screen
    navigation.navigate('BookingConfirmation', {
      trainerId,
      trainerName,
      packageTitle,
      price,
      date: selectedDate,
      time: selectedTime,
    });
  };

  const renderHeader = () => (
    <View style={styles.topBar}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Image
          source={LeftArrow}
          style={styles.backIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>
      <View style={styles.titleContainer}>
        <Text style={styles.topBarTitle}>Select Date & Time</Text>
        <Text style={styles.topBarSubtitle}>
          Select a time to schedule with {trainerName}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      <DateTimeSelector
        navigation={navigation}
        buttonText="Continue"
        onButtonPress={handleContinue}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: DIMENSIONS.spacing.xxl,
    paddingBottom: DIMENSIONS.spacing.lg,
    paddingHorizontal: DIMENSIONS.spacing.lg,
    backgroundColor: COLORS.primary,
  },
  backButton: {
    marginRight: DIMENSIONS.spacing.md,
  },
  backIcon: {
    width: 28,
    height: 28,
    tintColor: COLORS.white,
  },
  titleContainer: {
    flex: 1,
  },
  topBarTitle: {
    fontFamily: FontWeight.SemiBold,
    fontSize: 24,
    color: COLORS.white,
  },
  topBarSubtitle: {
    fontFamily: FontWeight.Regular,
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
  },
});

export default SelectDateTimeScreen;
