import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BasicTopBar from "../components/BasicTopBar";
import CancellationConfirmationModal from "../components/CancellationConfirmationModal";
import { REFRESH_INDICATOR_PROPS } from "../components/RefreshableScrollView";
import {
  COLORS,
  DIMENSIONS,
  formatUTCToDisplayDateTime,
} from "../config/constants";
import { STRINGS } from "../config/strings";
import FontWeight from "../hooks/useInterFonts";
import {
  BookingData,
  useGetUserBookingsQuery,
  useCancelBookingAtomicMutation,
  useLazyGetRefundQuoteQuery,
} from "../services/api/bookingApi";
import { useAuth } from "../contexts/AuthContext";
import { Toast } from "../components/ToastManager";

const ScheduledSessions: React.FC = ({ navigation }: any) => {
  const { user } = useAuth();
  const [cancelBookingAtomic] = useCancelBookingAtomicMutation();
  const [fetchRefundQuote, refundQuoteState] = useLazyGetRefundQuoteQuery();
  const [refreshing, setRefreshing] = useState(false);
  const [cancellationModalVisible, setCancellationModalVisible] =
    useState(false);
  const [selectedBookingForCancellation, setSelectedBookingForCancellation] =
    useState<BookingData | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const {
    data: bookingsResponse,
    isLoading,
    error,
    refetch,
  } = useGetUserBookingsQuery(
    {
      user_id: user?.id || "",
      status: "upcomming",
      page: 1,
      limit: 10,
    },
    {
      skip: !user?.id,
    }
  );

  const bookings =
    bookingsResponse && bookingsResponse.status && "data" in bookingsResponse
      ? (bookingsResponse as any).data?.bookings || []
      : [];
  const handleBookNew = () => {
    navigation.navigate("Main", {
      screen: "Find",
      params: {
        screen: "FindMain",
        params: { tab: "FindTrainers" },
      },
    });
  };

  const handleReschedule = (booking: BookingData) => {
    if (booking) {
      navigation.navigate("RescheduleSession", {
        booking,
      });
    }
  };

  const handleCancel = (booking: BookingData) => {
    if (booking.status === "upcomming") {
      setSelectedBookingForCancellation(booking);
      setCancellationModalVisible(true);
      // Server-authored refund figures for the sheet. Best-effort: the modal
      // shows its honest fallback while this loads or if it fails.
      void fetchRefundQuote({ id: booking.id });
    }
  };

  // Map the server quote (snake_case keys, minor-unit amounts) into the
  // sheet's shape. Only when something was actually charged — for an unpaid
  // session the modal's plain "amount paid" fallback beats a row of zeros.
  const refundQuote = useMemo(() => {
    const resp = refundQuoteState.data;
    const q = resp && resp.status ? resp.data : null;
    if (!q || !selectedBookingForCancellation) return undefined;
    if (String(q.booking_id) !== String(selectedBookingForCancellation.id)) {
      return undefined;
    }
    if (!q.charged || q.charged <= 0) return undefined;
    return {
      amount: q.charged / 100,
      fee: typeof q.fee === "number" ? q.fee / 100 : null,
      net: typeof q.net === "number" ? q.net / 100 : null,
      eta:
        q.expected_arrival?.business_days != null
          ? `${q.expected_arrival.business_days} business days`
          : q.expected_arrival?.estimated_date ?? null,
      currency: q.currency ? q.currency.toUpperCase() : null,
      policyText: q.policy_text ?? null,
    };
  }, [refundQuoteState.data, selectedBookingForCancellation]);

  const handleConfirmCancellation = async () => {
    // Guard against a double-confirm while the first request is in flight.
    if (!selectedBookingForCancellation || isCancelling) return;

    const booking = selectedBookingForCancellation;

    setIsCancelling(true);
    try {
      // One atomic call: the server cancels, refunds where a payment exists,
      // and reports the refund outcome. Idempotent — a retry answers
      // ALREADY_CANCELED with status: true, which lands here as success.
      const result = await cancelBookingAtomic({ id: booking.id }).unwrap();

      // The API answers 200 with { status: false, message } on failure, so an
      // unwrap() that resolves is not by itself proof of success.
      if (!result.status) {
        throw new Error(
          result.message ||
            STRINGS.SCHEDULED_SESSIONS.messages.cancellationFailed
        );
      }

      const refundError = result.data?.refund_error;
      if (refundError) {
        // Cancellation landed; only the refund failed. The server message is
        // user-presentable copy — report it honestly instead of a blanket
        // success toast.
        Toast.error(refundError);
        closeCancellationModal();
        return;
      }

      Toast.success(STRINGS.SCHEDULED_SESSIONS.messages.sessionCancelled);
      closeCancellationModal();
    } catch (error: any) {
      // Surface the real server message; keep the modal open so the user can
      // retry without re-selecting the session.
      Toast.error(
        error?.data?.message ||
          error?.message ||
          STRINGS.SCHEDULED_SESSIONS.messages.cancellationFailed
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const closeCancellationModal = () => {
    setCancellationModalVisible(false);
    setSelectedBookingForCancellation(null);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error("Error refreshing bookings:", error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <BasicTopBar
        onBackPress={() => navigation.goBack()}
        title={STRINGS.SCHEDULED_SESSIONS.title}
        subtitle={STRINGS.SCHEDULED_SESSIONS.subtitle}
        containerStyle={{
          paddingTop: DIMENSIONS.spacing.xxl,
          paddingBottom: DIMENSIONS.spacing.lg,
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            {...REFRESH_INDICATOR_PROPS}
          />
        }
      >
        <TouchableOpacity style={styles.bookButton} onPress={handleBookNew}>
          <Text style={styles.bookButtonText}>
            {STRINGS.SCHEDULED_SESSIONS.bookNewSession}
          </Text>
        </TouchableOpacity>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}

        {!isLoading && bookings.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {STRINGS.SCHEDULED_SESSIONS.noUpcomingSessions}
            </Text>
          </View>
        )}

        {bookings.length > 0 && (
          <View style={styles.sessionList}>
            {bookings.map((booking: BookingData) => {
              const { date: displayDate, time: displayTime } =
                formatUTCToDisplayDateTime(booking.date, booking.time);

              const currentBooking = {
                ...booking,
                date: displayDate,
                time: displayTime,
              };
              return (
                <View key={booking.id} style={styles.sessionCard}>
                  <View style={styles.sessionHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sessionDate}>{displayDate}</Text>
                      <Text style={styles.sessionTime}>{displayTime}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.sessionWith}>
                        {STRINGS.SCHEDULED_SESSIONS.with}
                      </Text>
                      <Text style={styles.sessionInstructor}>
                        {booking.trainer?.name || "Trainer"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.sessionLocationRow}>
                    <Text style={styles.sessionLocation}>
                      {booking.price?.title || "Session"}
                    </Text>
                  </View>

                  <View style={styles.sessionActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleReschedule(currentBooking)}
                    >
                      <Text style={styles.actionButtonText}>
                        {STRINGS.SCHEDULED_SESSIONS.reschedule}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        { borderWidth: 0 },
                        styles.cancelButton,
                      ]}
                      onPress={() => handleCancel(booking)}
                    >
                      <Text
                        style={[
                          styles.actionButtonText,
                          styles.cancelButtonText,
                        ]}
                      >
                        {STRINGS.SCHEDULED_SESSIONS.cancel}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <CancellationConfirmationModal
        visible={cancellationModalVisible}
        booking={selectedBookingForCancellation}
        isLoading={isCancelling}
        refundQuote={refundQuote}
        onClose={closeCancellationModal}
        onConfirm={handleConfirmCancellation}
      />

      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: DIMENSIONS.spacing.lg,
  },
  bookButton: {
    width: "100%",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  bookButtonText: {
    color: COLORS.black,
    fontFamily: FontWeight.Medium,
    fontSize: 14,
    letterSpacing: 0.2,
  },
  sessionList: {
    gap: 10,
  },
  sessionCard: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#6B6B6B",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sessionDate: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
    marginBottom: 2,
  },
  sessionTime: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.primary,
    marginBottom: 2,
  },
  sessionWith: {
    fontSize: 12,
    fontFamily: FontWeight.Medium,
    color: COLORS._5E5E5E,
  },
  sessionInstructor: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
  },
  sessionLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  sessionLocationIcon: {
    fontSize: 12,
    fontFamily: FontWeight.Medium,
    color: COLORS._5E5E5E,
  },
  sessionLocation: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  sessionActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 5,
  },
  actionButton: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
  },
  actionButtonText: {
    color: COLORS._383838,
    fontFamily: FontWeight.Medium,
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: COLORS.surface,
  },
  cancelButtonText: {
    color: COLORS._EB3434,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    color: COLORS._5E5E5E,
    fontSize: 14,
    fontFamily: FontWeight.Medium,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
});

export default ScheduledSessions;
