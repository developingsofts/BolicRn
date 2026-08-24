import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  ActivityIndicator,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, DIMENSIONS } from '../config/constants';
import BasicTopBar from '../components/BasicTopBar';
import RefreshableScrollView from '../components/RefreshableScrollView';
import FontWeight from '../hooks/useInterFonts';
import {
  WeightLifting,
  StrengthTraining,
  Cardio,
  BuddhistGym,
  Gym1,
  Gym,
  Man,
  Availabilituy as ScheduleIcon,
  Workout as IntensityIcon,
} from '../../assets';
import { useGetWorkoutsQuery, useGetWorkoutCategoriesQuery } from '../services/api/workoutApi';
import { useAuth } from '../contexts/AuthContext';
import type { Workout } from '../types';

const { width: screenWidth } = Dimensions.get('window');
const cardGap = DIMENSIONS.spacing.md;
const horizontalPadding = DIMENSIONS.spacing.lg * 2;
const cardWidth = (screenWidth - horizontalPadding - cardGap) / 2;

interface SelectWorkoutScreenProps {
  navigation: any;
}

/** One request covers the whole catalogue today (29 workouts server-side). */
const WORKOUT_PAGE_SIZE = 100;

/**
 * Artwork is keyed off a workout *category*, not off ad-hoc substring tests.
 *
 * `/workout/all` carries an `imageUrl` field but it is `null` for every workout
 * the backend currently serves, and `type` is free-form display text. The
 * authoritative `type` → slug mapping now comes from `GET /workout/categories`
 * (see SERVER_SLUG_TO_CATEGORY below); this alias table stays as the fallback
 * while that request is in flight or unavailable. Anything unrecognised falls
 * through to the one deliberate default below.
 */
type WorkoutCategory =
  | 'back'
  | 'chest'
  | 'shoulders'
  | 'arms'
  | 'legs'
  | 'core'
  | 'cardio'
  | 'yoga'
  | 'hiit'
  | 'fullBody'
  | 'other';

interface WorkoutCategoryDefinition {
  artwork: ImageSourcePropType;
  /** Normalised `type` values (lowercase, parentheticals stripped) that map here. */
  aliases: readonly string[];
}

const WORKOUT_CATEGORIES: Record<WorkoutCategory, WorkoutCategoryDefinition> = {
  back: { artwork: WeightLifting, aliases: ['back workout', 'back', 'pull'] },
  chest: { artwork: StrengthTraining, aliases: ['chest workout', 'chest', 'push'] },
  shoulders: {
    artwork: Gym1,
    aliases: ['shoulders workout', 'shoulder workout', 'shoulders', 'delts'],
  },
  arms: {
    artwork: WeightLifting,
    aliases: ['arms workout', 'arm workout', 'arms', 'biceps', 'triceps'],
  },
  legs: { artwork: Man, aliases: ['legs workout', 'leg workout', 'legs', 'lower body'] },
  core: { artwork: Gym1, aliases: ['core workout', 'core', 'abs'] },
  cardio: { artwork: Cardio, aliases: ['cardio workout', 'cardio', 'running', 'conditioning'] },
  yoga: { artwork: BuddhistGym, aliases: ['yoga workout', 'yoga', 'mobility', 'stretching'] },
  hiit: { artwork: StrengthTraining, aliases: ['hiit workout', 'hiit', 'circuit'] },
  fullBody: { artwork: Gym, aliases: ['full body workout', 'full body', 'total body'] },
  // Deliberate default: shown for any type the backend adds that is not listed above.
  other: { artwork: Man, aliases: [] },
};

const DEFAULT_WORKOUT_CATEGORY: WorkoutCategory = 'other';

const CATEGORY_BY_TYPE: ReadonlyMap<string, WorkoutCategory> = new Map(
  (Object.keys(WORKOUT_CATEGORIES) as WorkoutCategory[]).flatMap((category) =>
    WORKOUT_CATEGORIES[category].aliases.map(
      (alias) => [alias, category] as [string, WorkoutCategory],
    ),
  ),
);

const normalizeWorkoutType = (type?: string | null): string =>
  (type ?? '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z]+/g, ' ')
    .trim();

const getWorkoutCategory = (type?: string | null): WorkoutCategory =>
  CATEGORY_BY_TYPE.get(normalizeWorkoutType(type)) ?? DEFAULT_WORKOUT_CATEGORY;

/**
 * `GET /workout/categories` returns server-authored `{ type, category }` pairs —
 * the authoritative mapping from the display `type` to a machine slug. Once
 * loaded it wins over the alias table above. The slugs are the server's; only
 * `full_body` differs from the local artwork key.
 */
const SERVER_SLUG_TO_CATEGORY: Record<string, WorkoutCategory> = {
  back: 'back',
  chest: 'chest',
  shoulders: 'shoulders',
  arms: 'arms',
  legs: 'legs',
  core: 'core',
  cardio: 'cardio',
  yoga: 'yoga',
  hiit: 'hiit',
  full_body: 'fullBody',
};

interface WorkoutMetaChip {
  key: string;
  icon: ImageSourcePropType;
  label: string;
}

/**
 * Only renders metadata the payload actually carries — a missing or zero value
 * drops its chip instead of showing a placeholder. Calories are intentionally
 * never surfaced (see CLAUDE.md).
 */
const getWorkoutMetaChips = (workout: Workout): WorkoutMetaChip[] => {
  const chips: WorkoutMetaChip[] = [];

  // `totalDuration` is seconds, matching the workout-session timer.
  const durationSeconds = Number(workout.totalDuration);
  if (Number.isFinite(durationSeconds) && durationSeconds > 0) {
    chips.push({
      key: 'duration',
      icon: ScheduleIcon,
      label: `${Math.max(1, Math.round(durationSeconds / 60))} min`,
    });
  }

  const reportedCount = Number(workout.exerciseCount);
  const exerciseCount =
    Number.isFinite(reportedCount) && reportedCount > 0
      ? reportedCount
      : (workout.workoutExercises?.length ?? 0);
  if (exerciseCount > 0) {
    chips.push({
      key: 'exercises',
      icon: Gym,
      label: `${exerciseCount} ${exerciseCount === 1 ? 'exercise' : 'exercises'}`,
    });
  }

  const difficulty = typeof workout.difficulty === 'string' ? workout.difficulty.trim() : '';
  if (difficulty) {
    chips.push({ key: 'difficulty', icon: IntensityIcon, label: difficulty });
  }

  return chips;
};

const SelectWorkoutScreen: React.FC<SelectWorkoutScreenProps> = ({ navigation }) => {
  const { isAuthenticated } = useAuth();
  // The endpoint defaults to 10 results per page; ask for the full catalogue so
  // the picker is not silently truncated.
  const { data: workoutsResponse, isLoading, error, refetch } =
    useGetWorkoutsQuery({ limit: WORKOUT_PAGE_SIZE }, { skip: !isAuthenticated });
  // Server-authored type → category pairs; artwork prefers these over the local
  // alias table, so a reworded `type` no longer silently drops to the default icon.
  const { data: categoriesResponse } = useGetWorkoutCategoriesQuery();

  const serverCategoryByType = React.useMemo(() => {
    const map = new Map<string, WorkoutCategory>();
    const rows = categoriesResponse?.status
      ? categoriesResponse.data?.categories ?? []
      : [];
    rows.forEach((row) => {
      const category = SERVER_SLUG_TO_CATEGORY[row.category];
      if (category) map.set(normalizeWorkoutType(row.type), category);
    });
    return map;
  }, [categoriesResponse]);

  // Lookup order: the row's own `category` slug (observed live on /workout/all),
  // then the /workout/categories type-mapping, then the local alias table.
  const resolveWorkoutCategory = React.useCallback(
    (workout: Workout): WorkoutCategory =>
      (workout.category ? SERVER_SLUG_TO_CATEGORY[workout.category] : undefined) ??
      serverCategoryByType.get(normalizeWorkoutType(workout.type)) ??
      getWorkoutCategory(workout.type),
    [serverCategoryByType],
  );
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleWorkoutSelect = (workout: Workout) => {
    navigation.navigate('WorkoutSession', {
      workout: workout,
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView edges={[]} style={styles.container}>
        <BasicTopBar
          onBackPress={() => navigation.goBack()}
          title="Select Your Workout"
          subtitle="Loading workouts..."
          containerStyle={{ paddingTop: DIMENSIONS.spacing.xxl, paddingBottom: DIMENSIONS.spacing.lg }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading workouts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView edges={[]} style={styles.container}>
        <BasicTopBar
          onBackPress={() => navigation.goBack()}
          title="Select Your Workout"
          subtitle="Error loading workouts"
          containerStyle={{ paddingTop: DIMENSIONS.spacing.xxl, paddingBottom: DIMENSIONS.spacing.lg }}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load workouts. Please try again.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const workouts = workoutsResponse?.status ? workoutsResponse.data.workouts : [];
  const totalWorkouts = workoutsResponse?.status
    ? workoutsResponse.data.pagination?.totalWorkouts
    : undefined;
  const hasMoreWorkouts = Boolean(
    workoutsResponse?.status && workoutsResponse.data.pagination?.hasMore,
  );

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <BasicTopBar
        onBackPress={() => navigation.goBack()}
        title="Select Your Workout"
        subtitle="Let's start something..."
        containerStyle={{ paddingTop: DIMENSIONS.spacing.xxl, paddingBottom: DIMENSIONS.spacing.lg }}
      />

      <RefreshableScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      >
        {workouts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No workouts available yet.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {workouts.map((workout) => {
              const remoteArtwork = workout.imageUrl?.trim();
              const metaChips = getWorkoutMetaChips(workout);

              return (
                <TouchableOpacity
                  key={workout.id}
                  style={styles.card}
                  onPress={() => handleWorkoutSelect(workout)}
                  activeOpacity={0.8}
                >
                  <View style={styles.iconContainer}>
                    {remoteArtwork ? (
                      <Image
                        source={{ uri: remoteArtwork }}
                        style={styles.remoteImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Image
                        source={WORKOUT_CATEGORIES[resolveWorkoutCategory(workout)].artwork}
                        style={styles.workoutImage}
                        resizeMode="contain"
                      />
                    )}
                  </View>
                  <Text style={styles.cardTitle} numberOfLines={2} ellipsizeMode="tail">
                    {workout.title}
                  </Text>
                  {!!workout.type && <Text style={styles.cardSubtitle}>{workout.type}</Text>}
                  {metaChips.length > 0 && (
                    <View style={styles.metaRow}>
                      {metaChips.map((chip) => (
                        <View key={chip.key} style={styles.metaChip}>
                          <Image source={chip.icon} style={styles.metaIcon} resizeMode="contain" />
                          <Text style={styles.metaText} numberOfLines={1}>
                            {chip.label}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {hasMoreWorkouts && (
          <Text style={styles.footerNote}>
            {totalWorkouts
              ? `Showing ${workouts.length} of ${totalWorkouts} workouts.`
              : `Showing the first ${workouts.length} workouts.`}
          </Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingTop: DIMENSIONS.spacing.md,
    paddingBottom: DIMENSIONS.spacing.xxl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: cardGap,
  },
  card: {
    width: cardWidth,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: DIMENSIONS.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 190,
    marginBottom: cardGap,
  },
  iconContainer: {
    marginBottom: DIMENSIONS.spacing.md,
  },
  workoutImage: {
    width: 60,
    height: 60,
    tintColor: COLORS.white,
  },
  remoteImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: COLORS.buttonGrayBg,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
    textAlign: 'center',
    width: '100%',
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: FontWeight.Regular,
    color: COLORS._616888,
    textAlign: 'center',
    marginTop: DIMENSIONS.spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: DIMENSIONS.spacing.sm,
    gap: 6,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.buttonGrayBg,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: '100%',
  },
  metaIcon: {
    width: 11,
    height: 11,
    marginRight: 4,
    tintColor: COLORS.textSecondary,
  },
  metaText: {
    fontSize: 11,
    fontFamily: FontWeight.Medium,
    color: COLORS.textSecondary,
  },
  footerNote: {
    fontSize: 12,
    fontFamily: FontWeight.Regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: DIMENSIONS.spacing.sm,
  },
  emptyContainer: {
    paddingVertical: DIMENSIONS.spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: FontWeight.Regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: DIMENSIONS.spacing.xl,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: FontWeight.Regular,
    color: COLORS._616888,
    marginTop: DIMENSIONS.spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DIMENSIONS.spacing.lg,
  },
  errorText: {
    fontSize: 16,
    fontFamily: FontWeight.Regular,
    color: COLORS.error,
    textAlign: 'center',
  },
});

export default SelectWorkoutScreen;
