
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BasicTopBar from '../components/BasicTopBar';
import RefreshableScrollView from '../components/RefreshableScrollView';
import { COLORS, DIMENSIONS } from '../config/constants';
import STRINGS from '../config/strings';
import { ArrowDown, Workout as WorkoutIcon } from '../../assets';
import { Toast } from '../components/ToastManager';
import FontWeight from '../hooks/useInterFonts';
import { useGetWorkoutByIdQuery, useGetWorkoutHistoryQuery } from '../services/api/workoutApi';

interface LoggedSet {
  setNumber: number;
  reps: number | null;
  weight: number | null;
  /** Unit the set was logged in ("kg" | "lbs"), echoed per row by the API. */
  weightUnit: string | null;
  durationSeconds: number | null;
}

interface HistoryExercise {
  key: string;
  order: number;
  name: string;
  plannedSets: number | null;
  plannedReps: number | null;
  plannedDurationSeconds: number | null;
  loggedSets: LoggedSet[];
}

interface WorkoutItem {
  id: string;
  workoutId: string | null;
  title: string;
  category: string;
  duration: string;
  intensity: string;
  completedDate: string;
  exercises: HistoryExercise[];
  hasLoggedSets: boolean;
}

/**
 * Monochrome badge treatments. Category is still spelled out in the label text,
 * so colour is never the only carrier of meaning — these variants only help the
 * eye group repeated categories in a long list.
 */
const CATEGORY_BADGE_VARIANTS = [
  { backgroundColor: COLORS.white, borderColor: COLORS.white, textColor: COLORS.black },
  { backgroundColor: COLORS._383838, borderColor: COLORS._383838, textColor: COLORS.black },
  { backgroundColor: COLORS._5E5E5E, borderColor: COLORS._5E5E5E, textColor: COLORS.black },
  { backgroundColor: COLORS._C9C9C9, borderColor: COLORS._818181, textColor: COLORS.white },
  { backgroundColor: COLORS.background, borderColor: COLORS._5E5E5E, textColor: COLORS.white },
];

const getCategoryBadgeVariant = (category: string) => {
  const normalized = (category || '').trim().toLowerCase();

  if (!normalized) {
    return CATEGORY_BADGE_VARIANTS[CATEGORY_BADGE_VARIANTS.length - 1];
  }

  let hash = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 31 + normalized.charCodeAt(index)) % 100000;
  }

  return CATEGORY_BADGE_VARIANTS[hash % CATEGORY_BADGE_VARIANTS.length];
};

const toFiniteNumber = (value: any): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Builds a per-exercise view of a session from whatever the payload actually
 * carries: the logged per-set `progress` rows when the API returns them, and the
 * planned `workoutExercises` prescription otherwise. Nothing is invented — when
 * neither is present the card says so.
 */
const buildExercises = (session: any, detailedWorkout: any): HistoryExercise[] => {
  const plannedRows: any[] =
    (detailedWorkout?.workoutExercises as any[]) ??
    (session?.workout?.workoutExercises as any[]) ??
    [];
  const progressRows: any[] = (session?.progress as any[]) ?? [];

  const byKey = new Map<string, HistoryExercise>();

  plannedRows.forEach((row: any, index: number) => {
    const key = String(row?.id ?? row?.exerciseId ?? index);
    const exercise = row?.exercise ?? row?.exerciseDetails ?? {};
    const order = toFiniteNumber(row?.order) ?? index + 1;

    byKey.set(key, {
      key,
      order,
      name: String(exercise?.name ?? row?.name ?? `Exercise ${order}`).trim(),
      plannedSets: toFiniteNumber(row?.sets),
      plannedReps: toFiniteNumber(row?.reps),
      plannedDurationSeconds: toFiniteNumber(row?.duration ?? exercise?.duration),
      loggedSets: [],
    });
  });

  progressRows.forEach((row: any, index: number) => {
    const workoutExercise = row?.workoutExercise ?? {};
    const exercise = workoutExercise?.exercise ?? workoutExercise?.exerciseDetails ?? {};
    const key = String(row?.workoutExerciseId ?? workoutExercise?.id ?? `logged-${index}`);

    let entry = byKey.get(key);

    if (!entry) {
      const order = toFiniteNumber(workoutExercise?.order) ?? byKey.size + 1;
      entry = {
        key,
        order,
        name: String(exercise?.name ?? workoutExercise?.name ?? `Exercise ${order}`).trim(),
        plannedSets: toFiniteNumber(workoutExercise?.sets),
        plannedReps: toFiniteNumber(workoutExercise?.reps),
        plannedDurationSeconds: toFiniteNumber(workoutExercise?.duration ?? exercise?.duration),
        loggedSets: [],
      };
      byKey.set(key, entry);
    }

    entry.loggedSets.push({
      setNumber: toFiniteNumber(row?.setNumber) ?? entry.loggedSets.length + 1,
      reps: toFiniteNumber(row?.repsCompleted),
      weight: toFiniteNumber(row?.weightUsed),
      weightUnit: typeof row?.weightUnit === "string" ? row.weightUnit : null,
      durationSeconds: toFiniteNumber(row?.durationCompleted),
    });
  });

  return Array.from(byKey.values())
    .map((entry) => ({
      ...entry,
      loggedSets: entry.loggedSets.slice().sort((a, b) => a.setNumber - b.setNumber),
    }))
    .sort((a, b) => a.order - b.order);
};

const WorkoutHistory: React.FC<any> = ({ navigation }) => {
  const { data: workoutHistoryData, isLoading, error, refetch } = useGetWorkoutHistoryQuery();
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} mins`;
  };

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

  const getWorkoutCategory = (workout: any) => {
    return workout?.type || 'General';
  };

  const getWorkoutIntensity = (workout: any) => {
    return workout?.difficulty || 'Medium';
  };

  const apiData = workoutHistoryData as any;

  const completedSessions: any[] = useMemo(() => {
    const sessions = apiData?.data?.sessions ?? [];
    return sessions.filter((session: any) => session?.status === 'completed');
  }, [apiData]);

  const expandedSession = useMemo(
    () => completedSessions.find((session: any) => String(session?.id) === expandedId) ?? null,
    [completedSessions, expandedId],
  );

  const expandedWorkoutId = expandedSession?.workoutId
    ? String(expandedSession.workoutId)
    : '';

  // The history list response only reliably carries the session row, so the
  // planned exercise breakdown is fetched on demand for the open card.
  const needsWorkoutDetail =
    !!expandedWorkoutId &&
    !(expandedSession?.workout?.workoutExercises ?? []).length &&
    !(expandedSession?.progress ?? []).length;

  const {
    data: workoutDetailData,
    isFetching: workoutDetailFetching,
  } = useGetWorkoutByIdQuery(expandedWorkoutId, { skip: !needsWorkoutDetail });

  const detailedWorkout =
    workoutDetailData?.status && workoutDetailData.data
      ? (workoutDetailData.data as any)
      : null;

  const workouts: WorkoutItem[] = useMemo(
    () =>
      completedSessions.map((session: any) => {
        const isExpanded = String(session?.id) === expandedId;
        const exercises = buildExercises(session, isExpanded ? detailedWorkout : null);

        return {
          id: String(session.id),
          workoutId: session?.workoutId ? String(session.workoutId) : null,
          title: session.workout?.title || 'Unknown Workout',
          category: getWorkoutCategory(session.workout),
          duration: formatDuration(session.totalDuration || 0),
          intensity: getWorkoutIntensity(session.workout),
          completedDate: formatCompletedDate(session.completedAt || session.createdAt),
          exercises,
          hasLoggedSets: exercises.some((exercise) => exercise.loggedSets.length > 0),
        };
      }),
    [completedSessions, detailedWorkout, expandedId],
  );

  const handleStartWorkout = () => {
    navigation.navigate('SelectWorkout');
  };

  const handleToggleDetails = (sessionId: string) => {
    setExpandedId((current) => (current === sessionId ? null : sessionId));
  };

  const handlePostIt = (workout: WorkoutItem) => {
    if (!workout.workoutId) {
      Toast.error('This session has no workout attached, so it cannot be shared');
      return;
    }

    navigation.navigate('ShareWorkout', {
      workoutId: workout.workoutId,
      workoutTitle: workout.title,
      sessionId: workout.id,
    });
  };

  const renderPlannedLine = (exercise: HistoryExercise) => {
    const parts: string[] = [];

    if (exercise.plannedSets) {
      parts.push(`${exercise.plannedSets} ${STRINGS.WORKOUT_HISTORY.setsSuffix}`);
    }
    if (exercise.plannedReps) {
      parts.push(`${exercise.plannedReps} reps`);
    }
    if (!exercise.plannedReps && exercise.plannedDurationSeconds) {
      parts.push(`${exercise.plannedDurationSeconds}s`);
    }

    if (parts.length === 0) {
      return null;
    }

    return <Text style={styles.exerciseMeta}>{parts.join(' x ')}</Text>;
  };

  const renderLoggedSet = (exerciseKey: string, set: LoggedSet) => {
    const parts: string[] = [];

    if (set.reps !== null) {
      parts.push(`${set.reps} reps`);
    }
    if (set.durationSeconds !== null && set.reps === null) {
      parts.push(`${set.durationSeconds}s`);
    }
    if (set.weight !== null && set.weight > 0) {
      // Print the unit the set was actually logged in. New sets are "lbs";
      // rows recorded before the API carried a unit were stored as kg (the
      // server default), so that stays the fallback rather than assuming lbs.
      parts.push(`${set.weight} ${set.weightUnit ?? "kg"}`);
    }

    return (
      <View key={`${exerciseKey}-${set.setNumber}`} style={styles.setRow}>
        <Text style={styles.setLabel}>
          {STRINGS.WORKOUT_HISTORY.setLabel} {set.setNumber}
        </Text>
        <Text style={styles.setValue}>{parts.length > 0 ? parts.join('  ·  ') : '—'}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <BasicTopBar
        onBackPress={() => navigation.goBack()}
        title={STRINGS.WORKOUT_HISTORY.title}
        subtitle={STRINGS.WORKOUT_HISTORY.subtitle}
        containerStyle={{ paddingTop: DIMENSIONS.spacing.xxl, paddingBottom: DIMENSIONS.spacing.lg }}
      />

      <RefreshableScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      >
        <TouchableOpacity style={styles.startButton} onPress={handleStartWorkout}>
          <Text style={styles.startButtonText}>{STRINGS.WORKOUT_HISTORY.startNew}</Text>
        </TouchableOpacity>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{STRINGS.WORKOUT_HISTORY.loadFailed}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refetch}>
              <Text style={styles.retryButtonText}>{STRINGS.WORKOUT_HISTORY.retry}</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLoading && !error && workouts.length > 0 && (
          <View style={styles.workoutList}>
            {workouts.map((workout) => {
              const badge = getCategoryBadgeVariant(workout.category);
              const isExpanded = expandedId === workout.id;
              const detailLoading = isExpanded && workoutDetailFetching;

              return (
                <View key={workout.id} style={styles.card}>
                  <View style={styles.cardRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.title}>{workout.title}</Text>
                      <View style={styles.metaRow}>
                        <View
                          style={[
                            styles.badge,
                            {
                              backgroundColor: badge.backgroundColor,
                              borderColor: badge.borderColor,
                            },
                          ]}
                        >
                          <Text style={[styles.badgeText, { color: badge.textColor }]}>
                            {workout.category}
                          </Text>
                        </View>
                        <Text style={styles.metaText}>{workout.duration}</Text>
                        <Text style={styles.metaText}>{workout.intensity}</Text>
                      </View>
                      <Text style={styles.completedText}>
                        {STRINGS.WORKOUT_HISTORY.completed} {workout.completedDate}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.postButton}
                      onPress={() => handlePostIt(workout)}
                    >
                      <Text style={styles.postButtonText}>
                        {STRINGS.WORKOUT_HISTORY.postIt}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.detailToggle}
                    onPress={() => handleToggleDetails(workout.id)}
                  >
                    <Image source={WorkoutIcon} style={styles.detailToggleIcon} />
                    <Text style={styles.detailToggleText}>
                      {isExpanded
                        ? STRINGS.WORKOUT_HISTORY.hideDetails
                        : STRINGS.WORKOUT_HISTORY.viewDetails}
                    </Text>
                    <Image
                      source={ArrowDown}
                      style={[
                        styles.detailToggleChevron,
                        isExpanded && { transform: [{ rotate: '180deg' }] },
                      ]}
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.detailBody}>
                      {detailLoading && workout.exercises.length === 0 && (
                        <ActivityIndicator size="small" color={COLORS.primary} />
                      )}

                      {!detailLoading && workout.exercises.length === 0 && (
                        <Text style={styles.detailEmptyText}>
                          {STRINGS.WORKOUT_HISTORY.noExerciseDetail}
                        </Text>
                      )}

                      {workout.exercises.length > 0 && (
                        <>
                          <Text style={styles.detailHeading}>
                            {workout.hasLoggedSets
                              ? STRINGS.WORKOUT_HISTORY.loggedSets
                              : STRINGS.WORKOUT_HISTORY.plannedExercises}
                            {'  ·  '}
                            {workout.exercises.length}{' '}
                            {STRINGS.WORKOUT_HISTORY.exercisesSuffix}
                          </Text>

                          {workout.exercises.map((exercise) => (
                            <View key={exercise.key} style={styles.exerciseRow}>
                              <View style={styles.exerciseHeader}>
                                <Text style={styles.exerciseName}>{exercise.name}</Text>
                                {exercise.loggedSets.length > 0 && (
                                  <Text style={styles.exerciseSetCount}>
                                    {exercise.loggedSets.length}{' '}
                                    {STRINGS.WORKOUT_HISTORY.setsSuffix}
                                  </Text>
                                )}
                              </View>

                              {exercise.loggedSets.length > 0
                                ? exercise.loggedSets.map((set) =>
                                    renderLoggedSet(exercise.key, set),
                                  )
                                : renderPlannedLine(exercise)}
                            </View>
                          ))}
                        </>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {!isLoading && !error && workouts.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{STRINGS.WORKOUT_HISTORY.emptyTitle}</Text>
            <Text style={styles.emptySubtext}>{STRINGS.WORKOUT_HISTORY.emptySubtitle}</Text>
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
  headerWrapper: {
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
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
    backgroundColor: COLORS.primary,
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
    color: COLORS.black,
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
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: FontWeight.Medium,
    textTransform: 'capitalize',
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
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
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
  detailToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  detailToggleIcon: {
    width: 16,
    height: 16,
    tintColor: COLORS.textSecondary,
    resizeMode: 'contain',
  },
  detailToggleText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: FontWeight.Medium,
  },
  detailToggleChevron: {
    width: 14,
    height: 14,
    tintColor: COLORS.textSecondary,
    resizeMode: 'contain',
  },
  detailBody: {
    marginTop: 12,
    gap: 10,
  },
  detailHeading: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: FontWeight.Medium,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  detailEmptyText: {
    color: COLORS._5E5E5E,
    fontSize: 13,
    fontFamily: FontWeight.Regular,
  },
  exerciseRow: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  exerciseName: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    fontFamily: FontWeight.Medium,
  },
  exerciseSetCount: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: FontWeight.Medium,
  },
  exerciseMeta: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: FontWeight.Regular,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  setLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: FontWeight.Regular,
  },
  setValue: {
    color: COLORS.text,
    fontSize: 13,
    fontFamily: FontWeight.Medium,
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
    color: COLORS.black,
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

