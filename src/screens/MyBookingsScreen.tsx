import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RefreshableScrollView from "../components/RefreshableScrollView";
import BasicTopBar from "../components/BasicTopBar";
import MyBookingCard from "../components/MyBookingCard";
import {
  COLORS,
  DIMENSIONS,
  formatUTCToDisplayDateTime,
} from "../config/constants";
import FontWeight from "../hooks/useInterFonts";
import {
  useGetTrainerBookingsQuery,
  useCancelBookingAtomicMutation,
  BookingData,
} from "../services/api/bookingApi";
import { Toast } from "../components/ToastManager";
import { useAuth } from "../contexts/AuthContext";

/**
 * TODO(strings): move this block into `STRINGS.MY_BOOKINGS` in
 * `src/config/strings.ts` and import it from there. It lives here only because
 * `src/config/strings.ts` is owned by another agent right now — nothing below
 * should stay hardcoded in the JSX.
 */
const MY_BOOKINGS_COPY = {
  title: "My Bookings",
  subtitle: "View and manage your bookings",
  tabs: {
    upcoming: "Upcoming",
    completed: "Completed",
    canceled: "Canceled",
  },
  empty: {
    upcoming: "No upcoming bookings",
    completed: "No completed bookings",
    canceled: "No canceled bookings",
  },
  cancel: {
    dialogTitle: "Decline Client Request",
    dialogMessage: (date: string, time: string) =>
      `Decline the upcoming client session on ${date} at ${time}? The client will be notified and a refund will be initiated.`,
    confirmLabel: "Decline",
    cancelLabel: "Keep Session",
    successWithRefund: "Booking canceled and refund initiated",
    success: "Booking canceled",
    failed: "Failed to cancel booking",
    refundFailed:
      "Booking was canceled but the refund did not go through. Please retry the refund or contact support.",
  },
} as const;

type TabKey = "upcoming" | "completed" | "canceled";
type BookingStatus = "upcomming" | "completed" | "canceled";

const TABS: { key: TabKey; label: string; status: BookingStatus }[] = [
  { key: "upcoming", label: MY_BOOKINGS_COPY.tabs.upcoming, status: "upcomming" },
  {
    key: "completed",
    label: MY_BOOKINGS_COPY.tabs.completed,
    status: "completed",
  },
  { key: "canceled", label: MY_BOOKINGS_COPY.tabs.canceled, status: "canceled" },
];

const LIMIT_PER_PAGE = 10;

const emptyPages = (): Record<TabKey, Record<number, BookingData[]>> => ({
  upcoming: {},
  completed: {},
  canceled: {},
});

const firstPageOnly = (
  pages: Record<number, BookingData[]>
): Record<number, BookingData[]> => (pages?.[1] ? { 1: pages[1] } : {});

const getErrorMessage = (error: unknown, fallback: string): string => {
  const err = error as any;
  return (
    err?.data?.message ||
    err?.data?.error ||
    (typeof err?.data === "string" ? err.data : undefined) ||
    err?.message ||
    fallback
  );
};

const MyBookingsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("upcoming");
  const [refreshing, setRefreshing] = useState(false);
  const [cancelingId, setCancelingId] = useState<number | null>(null);

  // Pages are stored per tab keyed by page number (not appended blindly) so a
  // refetch of an already-loaded page replaces it instead of duplicating rows.
  const [pagesByTab, setPagesByTab] = useState(emptyPages);
  const [pageByTab, setPageByTab] = useState<Record<TabKey, number>>({
    upcoming: 1,
    completed: 1,
    canceled: 1,
  });
  const [totalPagesByTab, setTotalPagesByTab] = useState<Record<TabKey, number>>(
    { upcoming: 1, completed: 1, canceled: 1 }
  );
  // Ids canceled in this session — hidden from Upcoming until the refetch lands.
  const [canceledIds, setCanceledIds] = useState<number[]>([]);

  const trainerId = user?.id;
  const currentPage = pageByTab[activeTab] || 1;
  const currentStatus =
    TABS.find((tab) => tab.key === activeTab)?.status ?? "upcomming";

  const {
    data: bookingsResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetTrainerBookingsQuery(
    {
      trainer_id: trainerId || "",
      status: currentStatus,
      page: currentPage,
      limit: LIMIT_PER_PAGE,
    },
    {
      skip: !trainerId,
    }
  );

  const [cancelBookingAtomic] = useCancelBookingAtomicMutation();

  useEffect(() => {
    if (!bookingsResponse || bookingsResponse.status !== true) {
      return;
    }

    const payload = bookingsResponse.data;
    const bookings = payload?.bookings || [];

    setPagesByTab((prev) => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], [currentPage]: bookings },
    }));
    setTotalPagesByTab((prev) => ({
      ...prev,
      [activeTab]: payload?.pagination?.totalPages || 1,
    }));
  }, [bookingsResponse, activeTab, currentPage]);

  const currentBookings = useMemo(() => {
    const pages = pagesByTab[activeTab] || {};
    const seen = new Set<number>();
    const flattened: BookingData[] = [];

    Object.keys(pages)
      .map(Number)
      .sort((a, b) => a - b)
      .forEach((pageNum) => {
        (pages[pageNum] || []).forEach((booking) => {
          if (seen.has(booking.id)) {
            return;
          }
          if (activeTab === "upcoming" && canceledIds.includes(booking.id)) {
            return;
          }
          seen.add(booking.id);
          flattened.push(booking);
        });
      });

    return flattened;
  }, [pagesByTab, activeTab, canceledIds]);

  const hasMore = currentPage < (totalPagesByTab[activeTab] || 1);

  // Drops every page past the first and rewinds each tab to page 1, so the
  // RTK Query invalidation fired by the cancel mutation repopulates the list
  // instead of us splicing rows out of local state by hand.
  const resetPagination = useCallback(() => {
    setPageByTab({ upcoming: 1, completed: 1, canceled: 1 });
    setPagesByTab((prev) => ({
      upcoming: firstPageOnly(prev.upcoming),
      completed: firstPageOnly(prev.completed),
      canceled: firstPageOnly(prev.canceled),
    }));
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setPageByTab((prev) => ({ ...prev, [activeTab]: 1 }));
      setPagesByTab((prev) => ({
        ...prev,
        [activeTab]: firstPageOnly(prev[activeTab]),
      }));
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [activeTab, refetch]);

  // Switching tabs changes the query args, so RTK Query fetches the new tab on
  // its own — the old conditional refetch() re-fetched the *previous* tab.
  const handleTabChange = useCallback((tabKey: TabKey) => {
    setActiveTab(tabKey);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || isFetching || isLoading) {
      return;
    }
    setPageByTab((prev) => ({
      ...prev,
      [activeTab]: (prev[activeTab] || 1) + 1,
    }));
  }, [activeTab, hasMore, isFetching, isLoading]);

  /**
   * One atomic call: `POST /booking/cancel` flips the status AND settles the
   * money server-side, idempotently (a retry answers ALREADY_CANCELED as
   * success). When the cancel lands but the refund fails, the server reports
   * it via `refund_error` — we surface that instead of claiming success.
   */
  const handleDecline = useCallback(
    async (booking: BookingData) => {
      if (cancelingId !== null) {
        return;
      }

      setCancelingId(booking.id);
      try {
        const response = await cancelBookingAtomic({ id: booking.id }).unwrap();
        if (!response.status) {
          Toast.error(response.message || MY_BOOKINGS_COPY.cancel.failed);
          return;
        }

        setCanceledIds((prev) =>
          prev.includes(booking.id) ? prev : [...prev, booking.id]
        );
        resetPagination();

        const refundError = response.data?.refund_error;
        if (refundError) {
          // Cancelled, but the money didn't move — the server message is
          // user-presentable copy; report it instead of a blanket success.
          Toast.error(
            `${MY_BOOKINGS_COPY.cancel.refundFailed} (${refundError})`
          );
          return;
        }

        Toast.success(
          response.data?.refund
            ? MY_BOOKINGS_COPY.cancel.successWithRefund
            : MY_BOOKINGS_COPY.cancel.success
        );
      } catch (error: any) {
        Toast.error(getErrorMessage(error, MY_BOOKINGS_COPY.cancel.failed));
      } finally {
        setCancelingId(null);
      }
    },
    [cancelBookingAtomic, cancelingId, resetPagination]
  );

  const handleReschedule = useCallback(
    async (booking: any) => {
      try {
        // Route is registered as "RescheduleSession", and the screen reads
        // route.params.booking — not an id.
        navigation.navigate("RescheduleSession", { booking });
      } catch (error: any) {
        Toast.error(getErrorMessage(error, "Failed to reschedule booking"));
      }
    },
    [navigation]
  );

  const isEmptyState =
    currentBookings.length === 0 && !isLoading && !isFetching;

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <BasicTopBar
        onBackPress={() => navigation.goBack?.()}
        title={MY_BOOKINGS_COPY.title}
        subtitle={MY_BOOKINGS_COPY.subtitle}
        containerStyle={{
          paddingTop: DIMENSIONS.spacing.xxl,
          paddingBottom: DIMENSIONS.spacing.lg,
        }}
      />
      <View style={styles.tabContainerWrapper}>
        <View style={styles.tabContainer}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                activeTab === tab.key && styles.tabButtonActive,
              ]}
              onPress={() => handleTabChange(tab.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <RefreshableScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onMomentumScrollEnd={(event) => {
          const scrollPosition = event.nativeEvent.contentOffset.y;
          const scrollViewHeight = event.nativeEvent.layoutMeasurement.height;
          const contentHeight = event.nativeEvent.contentSize.height;

          if (scrollPosition + scrollViewHeight >= contentHeight - 100) {
            handleLoadMore();
          }
        }}
      >
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}

        {isEmptyState && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {MY_BOOKINGS_COPY.empty[activeTab]}
            </Text>
          </View>
        )}

        {currentBookings.length > 0 && (
          <View style={styles.bookingList}>
            {currentBookings.map((booking) => {
              const { date: displayDate, time: displayTime } =
                formatUTCToDisplayDateTime(booking.date, booking.time);

              const currentBooking = {
                ...booking,
                date: displayDate,
                time: displayTime,
              };
              return (
                <MyBookingCard
                  key={booking.id}
                  id={booking.id}
                  sessionType={booking.price?.title || "Session"}
                  date={displayDate}
                  timeRange={displayTime}
                  clientName={booking.user?.name || "User"}
                  clientInitial={(booking.user?.name || "U")[0].toUpperCase()}
                  booking={currentBooking}
                  onDecline={() => handleDecline(booking)}
                  onReschedule={() => handleReschedule(currentBooking)}
                  navigation={navigation}
                  hideActions={activeTab !== "upcoming"}
                  isDeclining={cancelingId === booking.id}
                  disabled={cancelingId !== null && cancelingId !== booking.id}
                  declineDialogTitle={MY_BOOKINGS_COPY.cancel.dialogTitle}
                  declineDialogMessage={MY_BOOKINGS_COPY.cancel.dialogMessage(
                    displayDate,
                    displayTime
                  )}
                  declineConfirmLabel={MY_BOOKINGS_COPY.cancel.confirmLabel}
                  declineCancelLabel={MY_BOOKINGS_COPY.cancel.cancelLabel}
                />
              );
            })}
          </View>
        )}

        {isFetching && currentBookings.length > 0 && (
          <View style={styles.paginationLoader}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        )}
      </RefreshableScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabContainerWrapper: {
    marginHorizontal: DIMENSIONS.spacing.md,
    marginTop: 10,
    marginBottom: 10,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 50,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tabButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderRadius: 50,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 16,
    color: COLORS._5E5E5E,
    fontFamily: FontWeight.Medium,
  },
  tabTextActive: {
    color: COLORS.black,
    fontFamily: FontWeight.Medium,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: DIMENSIONS.spacing.md,
  },
  bookingList: {
    gap: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  paginationLoader: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
});

export default MyBookingsScreen;
