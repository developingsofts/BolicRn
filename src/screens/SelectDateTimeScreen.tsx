import React from "react";
import { View, StyleSheet, Image, TouchableOpacity, Text } from "react-native";
import DateTimeSelector from "../components/DateTimeSelector";
import BasicTopBar from "../components/BasicTopBar";
import { COLORS, DIMENSIONS } from "../config/constants";
import FontWeight from "../hooks/useInterFonts";
import { LeftArrow } from "../../assets";

interface SelectDateTimeScreenProps {
  navigation: any;
  route?: {
    params?: {
      priceId?: string;
      trainerId?: string;
      trainerName?: string;
      packageName?: string;
      price?: number;
      description?: string;
      trainerAddress?: string;
    };
  };
}

const SelectDateTimeScreen: React.FC<SelectDateTimeScreenProps> = ({
  navigation,
  route,
}) => {
  const trainerName = route?.params?.trainerName || "Alex";
  const packageName = route?.params?.packageName || "Training Session";
  const price = route?.params?.price || 0;
  const priceId = route?.params?.priceId || '';
  const trainerId = route?.params?.trainerId;
  const description = route?.params?.description || "";
  const trainerAddress = route?.params?.trainerAddress || "";

  const handleContinue = (selectedDate: string, selectedTime: string, selectedSlots?: { date: string; time: string }[]) => {
    console.log("Selected:", selectedDate, selectedTime);
    console.log("All Selected Slots:", selectedSlots);
    
    // Navigate to confirmation screen
    navigation.navigate("BookingConfirmation", {
      priceId,
      trainerId,
      trainerName,
      packageName,
      price,
      description,
      trainerAddress,
      date: selectedDate,
      time: selectedTime,
      selectedSlots: selectedSlots || [{ date: selectedDate, time: selectedTime }],
    });
  };

  const renderHeader = () => (
    <BasicTopBar
      containerStyle={styles.topBar}
      onBackPress={() => navigation.goBack()}
      backButtonIcon={
        <Image
          source={LeftArrow}
          style={styles.backIcon}
          resizeMode="contain"
        />
      }
      title="Select Date & Time"
      subtitle={`Select a time to schedule with ${trainerName}`}
      titleStyle={styles.topBarTitle}
      subtitleStyle={styles.topBarSubtitle}
    />
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      <DateTimeSelector
        navigation={navigation}
        buttonText="Continue"
        trainerId={trainerId}
        sessionPrice={price.toString()}
        sessionPriceDesc={`$${price}/hr`}
        sessionTitle={packageName}
        sessionDescription={description}
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
    paddingTop: DIMENSIONS.spacing.xxl,
    paddingBottom: DIMENSIONS.spacing.lg,
  },
  backIcon: {
    width: 28,
    height: 28,
    tintColor: COLORS.white,
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
