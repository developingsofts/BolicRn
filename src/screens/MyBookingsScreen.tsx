import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
  useDeleteBookingMutation,
  useUpdateBookingMutation,
  BookingData,
} from "../services/api/bookingApi";
import { useSelector } from "react-redux";
import { Toast } from "../components/ToastManager";
import { useAuth } from "../contexts/AuthContext";

const TABS = [
  { key: "upcoming", label: "Upcoming", status: "upcomming" },
  { key: "completed", label: "Completed", status: "completed" },
  { key: "canceled", label: "Canceled", status: "canceled" },
];

const LIMIT_PER_PAGE = 10;

const MyBookingsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };
  const [pagination, setPagination] = useState<
    Record<string, { page: number; hasMore: boolean }>
  >({
    upcoming: { page: 1, hasMore: true },
    completed: { page: 1, hasMore: true },
    canceled: { page: 1, hasMore: true },
  });

  const trainerId = user?.id;

  const currentTabConfig = TABS.find((tab) => tab.key === activeTab);
  const currentStatus = currentTabConfig?.status as
    | "upcomming"
    | "completed"
    | "canceled";

  const {
    data: bookingsResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetTrainerBookingsQuery(
    {
      trainer_id: trainerId || "",
      status: currentStatus,
      page: pagination[activeTab]?.page || 1,
      limit: LIMIT_PER_PAGE,
    },
    {
      skip: !trainerId,
    }
  );

  const [deleteBooking] = useDeleteBookingMutation();
  const [updateBooking] = useUpdateBookingMutation();

  const [bookingsByTab, setBookingsByTab] = useState<Record<string, any[]>>({
    upcoming: [],
    completed: [],
    canceled: [],
  });

  useEffect(() => {
    if (
      bookingsResponse &&
      bookingsResponse.status &&
      "data" in bookingsResponse
    ) {
      const bookingData = (bookingsResponse as any).data;
      const currentPageNum = pagination[activeTab]?.page || 1;

      if (currentPageNum === 1) {
        setBookingsByTab((prev) => ({
          ...prev,
          [activeTab]: bookingData.bookings || [],
        }));
      } else {
        setBookingsByTab((prev) => ({
          ...prev,
          [activeTab]: [
            ...(prev[activeTab] || []),
            ...(bookingData.bookings || []),
          ],
        }));
      }

      const totalPages = bookingData.pagination?.totalPages || 1;
      setPagination((prev) => ({
        ...prev,
        [activeTab]: {
          page: currentPageNum,
          hasMore: currentPageNum < totalPages,
        },
      }));
    }
  }, [bookingsResponse, activeTab]);

  const handleTabChange = useCallback(
    (tabKey: string) => {
      if (tabKey === activeTab) {
        return;
      }

      setActiveTab(tabKey);

      if (
        bookingsByTab[tabKey]?.length === 0 &&
        pagination[tabKey]?.page === 1
      ) {
        refetch();
      }
    },
    [activeTab, bookingsByTab, pagination, refetch]
  );

  const handleLoadMore = useCallback(() => {
    if (pagination[activeTab]?.hasMore && !isFetching) {
      setPagination((prev) => ({
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          page: (prev[activeTab]?.page || 1) + 1,
        },
      }));
    }
  }, [activeTab, pagination, isFetching]);

  const handleDecline = useCallback(
    async (bookingId: number) => {
      try {
        await deleteBooking({ sessionId: bookingId}).unwrap();
        Toast.success("Booking declined successfully");

        setBookingsByTab((prev) => ({
          ...prev,
          [activeTab]: prev[activeTab].filter((b) => b.id !== bookingId),
        }));
      } catch (error: any) {
        Toast.error(error?.data?.message || "Failed to decline booking");
      }
    },
    [activeTab, deleteBooking]
  );

  const handleReschedule = useCallback(
    async (bookingId: number) => {
      try {
        navigation.navigate("RescheduleSessionScreen", { bookingId });
      } catch (error: any) {
        Toast.error(error?.data?.message || "Failed to reschedule booking");
      }
    },
    [navigation]
  );

  const currentBookings = bookingsByTab[activeTab] || [];

  const isEmptyState = currentBookings.length === 0 && !isLoading;

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <BasicTopBar
        onBackPress={() => navigation.goBack?.()}
        title="My Bookings"
        subtitle="View and manage your bookings"
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
            <Text style={styles.emptyStateText}>No {activeTab} bookings</Text>
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
                  onDecline={() => handleDecline(booking.id)}
                  onReschedule={() => handleReschedule(booking.id)}
                  navigation={navigation}
                  hideActions={activeTab !== "upcoming"}
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
