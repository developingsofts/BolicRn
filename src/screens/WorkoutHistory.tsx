
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BasicTopBar from '../components/BasicTopBar';
import { COLORS, DIMENSIONS } from '../config/constants';
import FontWeight from '../hooks/useInterFonts';
import { useGetWorkoutHistoryQuery } from '../services/api/workoutApi';

interface WorkoutItem {
  id: string;
  title: string;
  category: string;
  categoryColor: string;
  duration: string;
  intensity: string;
  completedDate: string;
  workoutData: any;
}

const WorkoutHistory: React.FC = ({ navigation }: any) => {
  const { data: workoutHistoryData, isLoading, error, refetch } = useGetWorkoutHistoryQuery();

  console.log('WorkoutHistory - Full response:', JSON.stringify(workoutHistoryData, null, 2));

  // Format duration from seconds to minutes
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} mins`;
  };

  // Format completed date
  const formatCompletedDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  // Get workout category and intensity from workout data
  const getWorkoutCategory = (workout: any) => {
    return workout?.type || 'General';
  };

  const getWorkoutIntensity = (workout: any) => {
    return workout?.difficulty || 'Medium';
  };

  // Transform API data to match UI structure
  const apiData = workoutHistoryData as any;
  const sessions = apiData?.data?.sessions || [];
  const workouts: WorkoutItem[] = sessions
    .filter((session: any) => session.status === 'completed') // Only show completed workouts
    .map((session: any) => ({
      id: session.id.toString(),
      title: session.workout?.title || 'Unknown Workout',
      category: getWorkoutCategory(session.workout),
      categoryColor: COLORS._D2E7FF,
      duration: formatDuration(session.totalDuration || 0),
      intensity: getWorkoutIntensity(session.workout),
      completedDate: formatCompletedDate(session.completedAt || session.createdAt),
      workoutData: session
    }));

  const handleStartWorkout = () => {
    navigation.navigate('SelectWorkout');
  };

  const handlePostIt = (workoutId: string) => {
    // TODO: Implement post workout logic
    console.log(`Post workout ${workoutId}`);
  };

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      {/* Header */}
      <BasicTopBar
        onBackPress={() => navigation.goBack()}
        title="Workout History"
        subtitle="View / Manage your workout history"
        containerStyle={{ paddingTop: DIMENSIONS.spacing.xxl, paddingBottom: DIMENSIONS.spacing.lg }}
      />

      {/* Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Start New Workout Button */}
        <TouchableOpacity style={styles.startButton} onPress={handleStartWorkout}>
          <Text style={styles.startButtonText}>Start New Workout</Text>
        </TouchableOpacity>

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load workout history</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refetch}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Workouts List */}
        {!isLoading && !error && workouts.length > 0 && (
          <View style={styles.workoutList}>
            {workouts.map((workout) => (
              <View key={workout.id} style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{workout.title}</Text>
                    <View style={styles.metaRow}>
                      <View style={[styles.badge, { backgroundColor: workout.categoryColor }]}> 
                        <Text
                          style={[
                            styles.badgeText,
                            { color: COLORS._0B80FF },
                          ]}
                        >
                          {workout.category}
                        </Text>
                      </View>
                      <Text style={styles.metaText}>{workout.duration}</Text>
                      <Text style={styles.metaText}>{workout.intensity}</Text>
                    </View>
                    <Text style={styles.completedText}>Completed: {workout.completedDate}</Text>
                  </View>
                  <TouchableOpacity style={styles.postButton} onPress={() => handlePostIt(workout.id)}>
                    <Text style={styles.postButtonText}>Post it</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {!isLoading && !error && workouts.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No workout history yet</Text>
            <Text style={styles.emptySubtext}>Complete your first workout to see it here!</Text>
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
  headerWrapper: {
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    paddingTop: DIMENSIONS.spacing.xxl,
    paddingBottom: DIMENSIONS.spacing.lg,
    backgroundColor: COLORS.primary,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: DIMENSIONS.spacing.lg,
  },
  startButton: {
    width: '100%',
    backgroundColor: '#0D8AFF',
    paddingVertical: 15,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  startButtonText: {
    color: COLORS.white,
    fontFamily: FontWeight.Medium,
    fontSize: 14,
    letterSpacing: 0.2,
  },
  workoutList: {
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
    marginBottom: 6,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: FontWeight.Medium,
  },
  metaText: {
    color: COLORS.text,
    fontSize: 13,
    fontFamily: FontWeight.Medium,
  },
  completedText: {
    color: COLORS._5E5E5E,
    fontSize: 14,
    fontFamily: FontWeight.Regular,
  },
  postButton: {
    paddingHorizontal: 5,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00000033',
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    marginLeft: 12,
    flexShrink: 0,
  },
  postButtonText: {
    color: COLORS.app_black,
    fontFamily: FontWeight.Medium,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
    fontFamily: FontWeight.Regular,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: FontWeight.Medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: COLORS.text,
    fontSize: 18,
    fontFamily: FontWeight.SemiBold,
    marginBottom: 8,
  },
  emptySubtext: {
    color: COLORS._5E5E5E,
    fontSize: 14,
    fontFamily: FontWeight.Regular,
    textAlign: 'center',
  },
});

export default WorkoutHistory;
