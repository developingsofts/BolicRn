import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  NavigationProp,
  ParamListBase,
  useNavigation,
  useRoute,
  RouteProp,
} from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import BasicTopBar from "../components/BasicTopBar";
import InfoCard from "../components/InfoCard";
import PriceBreakdown, { PriceItem } from "../components/PriceBreakdown";
import PaymentOptionsDialog from "../components/PaymentOptionsDialog";
import { Toast } from "../components/ToastManager";
import {
  COLORS,
  DIMENSIONS,
  convertLocaDatemmddyyyylToUTC,
} from "../config/constants";
import { STRINGS } from "../config/strings";
import { r } from "../designing/responsiveDesigns";
import FontWeight from "../hooks/useInterFonts";
import { LeftArrow } from "../../assets";
import { useCreateBookingMutation } from "../services/api/bookingApi";
import { useGetUserProfileQuery } from "../services/api/userApi";
import { useAuth } from "../contexts/AuthContext";
import { useStripePayment } from "../utils/stripeUtils";

type BookingConfirmationParams = {
  priceId?: string;
  trainerId?: string;
  trainerName?: string;
  packageName?: string;
  price?: number;
  description?: string;
  date?: string;
  time?: string;
  trainerAddress?: string;
  selectedSlots?: { date: string; time: string }[];
};

const BookingConfirmationScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const route =
    useRoute<RouteProp<{ params: BookingConfirmationParams }, "params">>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [createBooking] = useCreateBookingMutation();
  const { initializePaymentSheet, openPaymentSheet } = useStripePayment();
  const { isAuthenticated } = useAuth();

  const {
    priceId = "",
    trainerId,
    trainerName: passedTrainerName,
    packageName: passedPackageName,
    price = 0,
    description,
    date = "",
    time = "",
    trainerAddress,
    selectedSlots = [],
  } = route.params || {};

  const { data: trainerProfileData } = useGetUserProfileQuery(
    trainerId || "",
    { skip: !trainerId || !isAuthenticated },
  );

  const trainerProfile =
    trainerProfileData && trainerProfileData.status === true
      ? (trainerProfileData.data as any)
      : null;

  const trainerName =
    trainerProfile?.displayName ||
    trainerProfile?.userName ||
    passedTrainerName ||
    STRINGS.BOOKING_CONFIRMATION.fallbacks.trainer;

  const packageName =
    passedPackageName || STRINGS.BOOKING_CONFIRMATION.fallbacks.session;

  const location =
    trainerAddress?.trim() ||
    trainerProfile?.location ||
    trainerProfile?.userAddress?.city ||
    STRINGS.BOOKING_CONFIRMATION.fallbacks.location;

  const formatDateTimeDisplay = useMemo(() => {
    console.log("Selected Slots for formatting:", selectedSlots);
    if (selectedSlots && selectedSlots.length > 0) {
      const firstDate = new Date(selectedSlots[0].date);
      const dateStr = firstDate.toLocaleDateString("en-US", {
        month: "long",
        day: "2-digit",
        year: "numeric",
      });

      let timeRange: string;
      if (selectedSlots.length === 1) {
        timeRange = `At ${selectedSlots[0].time}`;
      } else {
        timeRange = `From ${selectedSlots[0].time} to ${selectedSlots[selectedSlots.length - 1].time}`;
      }

      return {
        dateTime: `${dateStr}\n${timeRange}`,
        displayDate: dateStr,
        displayTime: timeRange,
      };
    } else {
      return {
        dateTime: `${date} at ${time}`,
        displayDate: date,
        displayTime: time,
      };
    }
  }, [selectedSlots, date, time]);
  console.log("Constructing sessionData with:", packageName);
  const sessionData = useMemo(() => {
    const slotCount = Math.max(selectedSlots.length, 1);
    const label =
      slotCount > 1 ? `${packageName} × ${slotCount}` : packageName;

    return {
      trainer: trainerName,
      dateTime: formatDateTimeDisplay.dateTime,
      location,
      description,
      priceItems: [{ label, amount: price * slotCount }] as PriceItem[],
      total: price * slotCount,
    };
  }, [
    trainerName,
    packageName,
    price,
    location,
    description,
    selectedSlots.length,
    formatDateTimeDisplay,
  ]);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
    Toast.info(STRINGS.BOOKING_CONFIRMATION.messages.goingBack);
  }, [navigation]);

  const handleProceedToPayment = useCallback(async () => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    console.log("priceSending", sessionData.total);
    try {
      const localDateStr = selectedSlots[0]?.date || date;
      const localTimeStr = selectedSlots[0]?.time || time;

      const { utcDate, utcTime } = convertLocaDatemmddyyyylToUTC(
        localDateStr,
        localTimeStr,
      );

      if (!utcDate || !utcTime) {
        throw new Error(
          STRINGS.BOOKING_CONFIRMATION.errors.dateConversionError,
        );
      }
      if (!priceId) {
        throw new Error(STRINGS.BOOKING_CONFIRMATION.errors.missingPrice);
      }

      const { error: initError } = await initializePaymentSheet({
        priceId,
        amount: sessionData.total,
        metadata: {
          trainerId: trainerId || "",
          date: utcDate,
          time: utcTime,
        },
      });

      if (initError) {
        Alert.alert(STRINGS.COMMON.error, initError);
        setIsProcessing(false);
        return;
      }

      const { error: paymentError, success } = await openPaymentSheet();

      if (paymentError) {
        Alert.alert(STRINGS.BOOKING_CONFIRMATION.messages.paymentCancelled);
        setIsProcessing(false);
        return;
      }

      if (success) {
        const slots =
          selectedSlots.length > 0
            ? selectedSlots
            : [{ date: localDateStr, time: localTimeStr }];

        const results = await Promise.allSettled(
          slots.map(async (slot) => {
            const converted = convertLocaDatemmddyyyylToUTC(
              slot.date,
              slot.time,
            );
            if (!converted.utcDate || !converted.utcTime) {
              throw new Error(
                STRINGS.BOOKING_CONFIRMATION.errors.dateConversionError,
              );
            }

            const res = await createBooking({
              trainer_id: trainerId || "",
              price_id: priceId,
              date: converted.utcDate,
              time: converted.utcTime,
              status: "upcomming",
            }).unwrap();

            if (!res?.status) {
              throw new Error(
                res?.message ||
                  STRINGS.BOOKING_CONFIRMATION.messages.bookingFailed,
              );
            }
            return res;
          }),
        );

        const failed = results.filter((r) => r.status === "rejected");
        setIsProcessing(false);

        if (failed.length > 0) {
          console.error(
            "[BookingConfirmation] Paid but booking creation failed:",
            failed,
          );
          Alert.alert(
            STRINGS.COMMON.error,
            failed.length === slots.length
              ? STRINGS.BOOKING_CONFIRMATION.messages.paidButNotBooked
              : `${STRINGS.BOOKING_CONFIRMATION.messages.paidPartiallyBooked} (${
                  slots.length - failed.length
                }/${slots.length})`,
          );
          return;
        }

        Toast.success(
          STRINGS.BOOKING_CONFIRMATION.messages.paymentSuccess,
          2500,
        );

        navigation.navigate("BookingSuccess", {
          trainerId,
          trainerName,
          packageName,
          price: sessionData.total,
          dateTime: sessionData.dateTime,
          location: sessionData.location,
          slotCount: slots.length,
        });
      }
    } catch (error) {
      console.error("[BookingConfirmation] Payment error:", error);
      Alert.alert(
        STRINGS.COMMON.error,
        STRINGS.BOOKING_CONFIRMATION.messages.paymentError,
      );
      setIsProcessing(false);
    }
  }, [
    isProcessing,
    initializePaymentSheet,
    openPaymentSheet,
    sessionData.total,
    packageName,
    trainerName,
    trainerId,
    priceId,
    selectedSlots,
    date,
    time,
    createBooking,
    navigation,
  ]);

  const handleConfirmPayment = useCallback(
    (paymentMethod: string) => {
      setShowPaymentDialog(false);
      setIsProcessing(true);
      Toast.info(`Processing payment via ${paymentMethod}...`, 1500);

      (async () => {
        try {
          const localDateStr = selectedSlots[0]?.date || date;
          const localTimeStr = selectedSlots[0]?.time || time;

          console.log("[BookingConfirmation] Local date:", localDateStr);
          console.log("[BookingConfirmation] Local time:", localTimeStr);

          const { utcDate, utcTime } = convertLocaDatemmddyyyylToUTC(
            localDateStr,
            localTimeStr,
          );

          if (!utcDate || !utcTime) {
            throw new Error(
              STRINGS.BOOKING_CONFIRMATION.errors.dateConversionError,
            );
          }

          console.log("[BookingConfirmation] Creating booking with:");
          console.log("  UTC Date:", utcDate);
          console.log("  UTC Time:", utcTime);
          console.log("  Trainer ID:", trainerId);
          console.log("  Price ID:", priceId);

          const response = await createBooking({
            trainer_id: trainerId || "",
            price_id: priceId || "",
            date: utcDate,
            time: utcTime,
            status: "upcomming",
          }).unwrap();

          Toast.success(
            STRINGS.BOOKING_CONFIRMATION.messages.paymentSuccess,
            2500,
          );
          setIsProcessing(false);

          navigation.navigate("BookingSuccess", {
            trainerId,
            trainerName,
            dateTime: sessionData.dateTime,
            location: sessionData.location,
          });
        } catch (error: any) {
          console.error("[BookingConfirmation] Booking failed:", error);
          Toast.error(
            error?.data?.message ||
            STRINGS.BOOKING_CONFIRMATION.messages.bookingFailed,
            2500,
          );
          setIsProcessing(false);
        }
      })();
    },
    [
      navigation,
      trainerId,
      trainerName,
      sessionData,
      selectedSlots,
      date,
      time,
      createBooking,
      route.params?.priceId,
    ],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <BasicTopBar
        containerStyle={styles.topBar}
        onBackPress={handleBack}
        backButtonIcon={
          <Image
            source={LeftArrow}
            style={styles.backIcon}
            resizeMode="contain"
          />
        }
        title={STRINGS.BOOKING_CONFIRMATION.title}
        subtitle={STRINGS.BOOKING_CONFIRMATION.subtitle}
        titleStyle={styles.topBarTitle}
        subtitleStyle={styles.topBarSubtitle}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardsContainer}>
          <InfoCard
            label={STRINGS.BOOKING_CONFIRMATION.infoCards.trainer}
            value={sessionData.trainer}
            icon={<Feather name="user" size={r(18)} color={COLORS.primary} />}
          />

          <InfoCard
            label={STRINGS.BOOKING_CONFIRMATION.infoCards.session}
            value={
              sessionData.description
                ? `${packageName}\n${sessionData.description}`
                : packageName
            }
            icon={
              <Feather name="clipboard" size={r(18)} color={COLORS.primary} />
            }
          />

          <InfoCard
            label={STRINGS.BOOKING_CONFIRMATION.infoCards.dateTime}
            value={sessionData.dateTime}
            icon={
              <Feather name="calendar" size={r(18)} color={COLORS.primary} />
            }
          />

          <InfoCard
            label={STRINGS.BOOKING_CONFIRMATION.infoCards.location}
            value={sessionData.location}
            icon={
              <Feather name="map-pin" size={r(18)} color={COLORS.primary} />
            }
          />

          <PriceBreakdown
            items={sessionData.priceItems}
            total={sessionData.total}
          />

          <View style={styles.policyContainer}>
            <View style={styles.policyIconContainer}>
              <Feather
                name="alert-circle"
                size={r(20)}
                color={COLORS.primary}
              />
            </View>
            <View style={styles.policyContentContainer}>
              <Text style={styles.policyTitle}>
                {STRINGS.BOOKING_CONFIRMATION.cancellationPolicy.title}
              </Text>
              {/* Copy comes from STRINGS, which mirrors the server's refund
                  policy config. The fee/timeline were previously interpolated
                  from hardcoded "3%" and "5-7 business days" values. */}
              <Text style={styles.policyDescription}>
                {STRINGS.BOOKING_CONFIRMATION.cancellationPolicy.description}
              </Text>
              {STRINGS.BOOKING_CONFIRMATION.cancellationPolicy.details.map(
                (detail) => (
                  <View key={detail} style={styles.policyDetailRow}>
                    <View style={styles.policyDetailDot} />
                    <Text style={styles.policyDetail}>{detail}</Text>
                  </View>
                ),
              )}
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.ctaButton, isProcessing && styles.ctaButtonDisabled]}
            activeOpacity={0.85}
            onPress={handleProceedToPayment}
            disabled={isProcessing}
          >
            <View style={styles.buttonContent}>
              {isProcessing ? (
                <>
                  <ActivityIndicator color={COLORS.black} size="small" />
                  <Text style={styles.buttonText}>
                    {STRINGS.BOOKING_CONFIRMATION.buttons.processing}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.buttonText}>
                    {STRINGS.BOOKING_CONFIRMATION.buttons.proceedToPayment}
                  </Text>
                  <Feather
                    name="arrow-right"
                    size={r(18)}
                    color={COLORS.white}
                  />
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <PaymentOptionsDialog
        visible={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        onConfirmPayment={handleConfirmPayment}
        amount={sessionData.total}
        remainingSessions={2}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: r(20),
    paddingVertical: r(24, "height"),
    gap: r(24, "height"),
  },
  cardsContainer: {
    gap: r(16, "height"),
  },
  policyContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: r(16),
    gap: r(14),
    borderRadius: r(16),
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  policyIconContainer: {
    width: r(40),
    height: r(40),
    borderRadius: r(20),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: `${COLORS.primary}15`,
    marginTop: r(2),
  },
  policyContentContainer: {
    flex: 1,
    gap: r(10, "height"),
  },
  policyTitle: {
    fontFamily: FontWeight.SemiBold,
    fontSize: r(15, "font"),
    color: COLORS.text,
  },
  policyDescription: {
    fontFamily: FontWeight.Regular,
    fontSize: r(13, "font"),
    color: COLORS.textSecondary,
    lineHeight: r(20),
  },
  policyHighlight: {
    fontFamily: FontWeight.SemiBold,
    color: COLORS.primary,
  },
  policyDetailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: r(8),
    marginTop: r(2, "height"),
  },
  policyDetailDot: {
    width: r(4),
    height: r(4),
    borderRadius: r(2),
    backgroundColor: COLORS.primary,
    marginTop: r(6),
  },
  policyDetail: {
    flex: 1,
    fontFamily: FontWeight.Regular,
    fontSize: r(12, "font"),
    color: COLORS.textSecondary,
    lineHeight: r(18),
  },
  buttonContainer: {
    marginTop: r(12, "height"),
  },
  ctaButton: {
    borderRadius: r(5),
    backgroundColor: COLORS.primary,
    paddingVertical: r(10, "height"),
    paddingHorizontal: r(24),
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaButtonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: r(10),
  },
  buttonText: {
    color: COLORS.black,
    fontFamily: FontWeight.SemiBold,
    fontSize: r(16, "font"),
  },
});

export default BookingConfirmationScreen;
