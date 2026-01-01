import React, { useState } from "react";
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
import {
  COLORS,
  DIMENSIONS,
  formatUTCToDisplayDateTime,
} from "../config/constants";
import FontWeight from "../hooks/useInterFonts";
import {
  BookingData,
  useGetUserBookingsQuery,
  useDeleteBookingMutation,
} from "../services/api/bookingApi";
import { useAuth } from "../contexts/AuthContext";
import { Toast } from "../components/ToastManager";

const sessions = [
  {
    id: "1",
    icon: "📅",
    title: "Session with Alex",
    description: "Sunday, Oct 14, 2025 at 9:00 AM\nDowntown Fitness Club",
    progress: 1,
    maxProgress: 1,
    status: "upcoming",
    trainerName: "Alex",
  },
  {
    id: "2",
    icon: "📅",
    title: "Session with Jordan",
    description: "Monday, Oct 15, 2025 at 10:30 AM\nCity Gym",
    progress: 0,
    maxProgress: 1,
    status: "upcoming",
    trainerName: "Jordan",
  },
];

const ScheduledSessions: React.FC = ({ navigation }: any) => {
  const { user } = useAuth();
  const [deleteBooking] = useDeleteBookingMutation();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch user's upcoming bookings
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

  // Extract bookings from response
  const bookings =
    bookingsResponse && bookingsResponse.status && "data" in bookingsResponse
      ? (bookingsResponse as any).data?.bookings || []
      : [];
  const handleBookNew = () => {
    // Navigate to Main tab navigator, then to Find tab with params
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

  const handleCancel = async (id: number) => {
    try {
      await deleteBooking({ id, status: "canceled" }).unwrap();
      Toast.success("Session canceled successfully");
    } catch (error) {
      Toast.error("Failed to cancel session");
    }
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
        title="Scheduled Sessions"
        subtitle="Your upcoming sessions with trainers"
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
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        <TouchableOpacity style={styles.bookButton} onPress={handleBookNew}>
          <Text style={styles.bookButtonText}>Book New Session</Text>
        </TouchableOpacity>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}

        {!isLoading && bookings.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No upcoming sessions</Text>
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
                  {/* Header with date/time on left and trainer on right */}
                  <View style={styles.sessionHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sessionDate}>{displayDate}</Text>
                      <Text style={styles.sessionTime}>{displayTime}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.sessionWith}>with</Text>
                      <Text style={styles.sessionInstructor}>
                        {booking.trainer?.name || "Trainer"}
                      </Text>
                    </View>
                  </View>

                  {/* Location row */}
                  <View style={styles.sessionLocationRow}>
                    <Text style={styles.sessionLocation}>
                      {booking.price?.title || "Session"}
                    </Text>
                  </View>

                  {/* Actions row */}
                  <View style={styles.sessionActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleReschedule(currentBooking)}
                    >
                      <Text style={styles.actionButtonText}>Reschedule</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        { borderWidth: 0 },
                        styles.cancelButton,
                      ]}
                      onPress={() => handleCancel(booking.id)}
                    >
                      <Text
                        style={[
                          styles.actionButtonText,
                          styles.cancelButtonText,
                        ]}
                      >
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
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
    color: COLORS.white,
    fontFamily: FontWeight.Medium,
    fontSize: 14,
    letterSpacing: 0.2,
  },
  sessionList: {
    gap: 10,
  },
  sessionCard: {
    width: "100%",
    backgroundColor: "#fff",
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
    color: COLORS.gradient1,
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
    color: COLORS.gradient1,
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
    backgroundColor: COLORS.white,
    alignItems: "center",
  },
  actionButtonText: {
    color: COLORS._383838,
    fontFamily: FontWeight.Medium,
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: COLORS.white,
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
