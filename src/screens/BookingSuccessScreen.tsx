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
import { STRINGS } from "../config/strings";
import { r } from "../designing/responsiveDesigns";
import FontWeight from "../hooks/useInterFonts";
import { PaymentSuccess } from "../../assets";

type BookingSuccessParams = {
  trainerName?: string;
  packageName?: string;
  price?: number;
  dateTime?: string;
  location?: string;
  trainerId?: string;
  slotCount?: number;
};

const BookingSuccessScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const route = useRoute<RouteProp<{ params: BookingSuccessParams }, "params">>();

  const {
    trainerName = STRINGS.BOOKING_CONFIRMATION.fallbacks.trainer,
    packageName,
    price,
    dateTime,
    location,
    trainerId,
    slotCount = 1,
  } = route.params || {};

  const sessionLabel =
    packageName && slotCount > 1
      ? `${packageName} × ${slotCount}`
      : packageName;

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
          {!!sessionLabel && (
            <Text style={styles.sessionText}>{sessionLabel}</Text>
          )}
          {!!dateTime && <Text style={styles.dateTimeText}>{dateTime}</Text>}
          {!!location && (
            <Text style={styles.locationText}>at {location}</Text>
          )}
          {typeof price === "number" && price > 0 && (
            <View style={styles.paidRow}>
              <Text style={styles.paidLabel}>Paid</Text>
              <Text style={styles.paidValue}>${price.toFixed(2)}</Text>
            </View>
          )}
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
  sessionText: {
    fontSize: r(13),
    fontFamily: FontWeight.Medium,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: DIMENSIONS.spacing.xs,
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
  paidRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: DIMENSIONS.spacing.md,
    paddingTop: DIMENSIONS.spacing.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  paidLabel: {
    fontSize: r(14),
    fontFamily: FontWeight.Regular,
    color: COLORS.textSecondary,
  },
  paidValue: {
    fontSize: r(16),
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
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
