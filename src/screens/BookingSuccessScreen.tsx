import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  NavigationProp,
  ParamListBase,
  useNavigation,
  useRoute,
  RouteProp,
} from "@react-navigation/native";
import { COLORS, DIMENSIONS } from "../config/constants";
import { r } from "../designing/responsiveDesigns";
import FontWeight from "../hooks/useInterFonts";
import { PaymentSuccess } from "../../assets";

type BookingSuccessParams = {
  trainerName?: string;
  dateTime?: string;
  location?: string;
  trainerId?: string;
};

const BookingSuccessScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const route = useRoute<RouteProp<{ params: BookingSuccessParams }, "params">>();

  const {
    trainerName = "Alex",
    dateTime = "Sunday, Oct 14, 2025 at 9:00 AM",
    location = "Downtown Fitness Club",
    trainerId,
  } = route.params || {};

  const handleChatWithTrainer = useCallback(() => {
    if (trainerId) {
      navigation.navigate("Chat", {
        partnerId: trainerId,
        partnerName: trainerName,
        from : "bookingSuccess",
      });
    }
  }, [navigation, trainerId, trainerName]);

  const handleUpdateCancel = useCallback(() => {
    navigation.navigate("Main", { screen: "Profile" });
  }, [navigation]);

  const handleBackToHome = useCallback(() => {
    navigation.navigate("Main");
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Image
            source={PaymentSuccess}
            style={styles.successIcon}
            resizeMode="contain"
          />
        </View>

        <View style={styles.headerContainer}>
          <Text style={styles.title}>Session Booked!</Text>
          <Text style={styles.subtitle}>
            Your session with {trainerName} is confirmed.
          </Text>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.dateTimeText}>{dateTime}</Text>
          <Text style={styles.locationText}>at {location}</Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleChatWithTrainer}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Chat with Trainer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlineButton}
            onPress={handleUpdateCancel}
            activeOpacity={0.8}
          >
            <Text style={styles.outlineButtonText}>Update/Cancel</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.homeLink}
          onPress={handleBackToHome}
          activeOpacity={0.7}
        >
          <Text style={styles.homeLinkText}>Back to Home</Text>
        </TouchableOpacity>

        <View style={styles.separator} />

        <Text style={styles.infoText}>
          You can view and update your scheduled sessions through profile anytime.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop:DIMENSIONS.spacing.xxl,
  },
  container: {
    flex: 1,
    paddingHorizontal: DIMENSIONS.spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: DIMENSIONS.spacing.xl,
  },
  successIcon: {
    width: r(120),
    height: r(120),
  },
  headerContainer: {
    marginBottom: DIMENSIONS.spacing.lg,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
    fontWeight:600,
    marginBottom: DIMENSIONS.spacing.sm,
  },
  subtitle: {
    fontSize: 14,
     fontWeight:500,
    fontFamily: FontWeight.Medium,
    color: COLORS._5E5E5E,
    textAlign: "center",
  },
  detailsCard: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: DIMENSIONS.spacing.md,
    marginBottom: DIMENSIONS.spacing.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateTimeText: {
    fontSize: r(18),
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.xs,
  },
  locationText: {
    fontSize: r(14),
    fontFamily: FontWeight.Regular,
    color: COLORS.textSecondary,
  },
  actionsContainer: {
    width: "100%",
    gap: DIMENSIONS.spacing.md,
    marginBottom: DIMENSIONS.spacing.sm,
  },
  primaryButton: {
    width: "100%",
    backgroundColor: COLORS.primary,
    paddingVertical: DIMENSIONS.spacing.md,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontSize: r(16),
    fontFamily: FontWeight.SemiBold,
    color: COLORS.black,
  },
  outlineButton: {
    width: "100%",
    backgroundColor: COLORS.surface,
    paddingVertical: DIMENSIONS.spacing.md,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 0px 12px 0px #76767626",
  },
  outlineButtonText: {
    fontSize:14,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
  },
  homeLink: {
    marginBottom: DIMENSIONS.spacing.xl,
    paddingVertical: DIMENSIONS.spacing.sm,
  },
  homeLinkText: {
    fontSize: 14,
    fontWeight:500,
    fontFamily: FontWeight.Medium,
    color: COLORS.primary,
  },
  separator: {
    width: "100%",
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: DIMENSIONS.spacing.lg,
  },
  infoText: {
    fontSize: r(14),
    fontFamily: FontWeight.Regular,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: r(20),
    paddingHorizontal: DIMENSIONS.spacing.md,
  },
});

export default BookingSuccessScreen;
