import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, DIMENSIONS } from '../config/constants';
import BasicTopBar from '../components/BasicTopBar';
import ConfirmationDialog from '../components/ConfirmationDialog';
import FontWeight from '../hooks/useInterFonts';
import type { Workout } from '../types';
import {
  useStartWorkoutSessionMutation,
  useGetActiveWorkoutSessionQuery,
  useCompleteExerciseMutation,
  useCompleteWorkoutSessionMutation,
  usePauseWorkoutSessionMutation,
  useResumeWorkoutSessionMutation,
  useCancelWorkoutSessionMutation,
  useGetWorkoutByIdQuery,
} from '../services/api/workoutApi';

interface WorkoutSessionScreenProps {
  navigation: any;
  route: any;
}

const formatTime = (totalSeconds: number) => {
  const safe = Math.max(0, Math.floor(totalSeconds || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const WorkoutSessionScreen: React.FC<WorkoutSessionScreenProps> = ({ navigation, route }) => {
  const { workout: initialWorkout } = route.params as { workout: Workout };

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);

  const [repsInput, setRepsInput] = useState('');
  const [weightInput, setWeightInput] = useState('');

  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [advanceAfterRest, setAdvanceAfterRest] = useState(false);

  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [setsLogged, setSetsLogged] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [hasWorkoutStarted, setHasWorkoutStarted] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);

  const { data: workoutResponse, isLoading: workoutLoading } = useGetWorkoutByIdQuery(initialWorkout.id);
  const workout = workoutResponse?.status ? workoutResponse.data : initialWorkout;

  const [startWorkoutSession] = useStartWorkoutSessionMutation();
  const { data: activeSessionData, isLoading: activeSessionLoading } = useGetActiveWorkoutSessionQuery(undefined);
  const [completeExercise, { isLoading: isLoggingSet }] = useCompleteExerciseMutation();
  const [completeWorkoutSession] = useCompleteWorkoutSessionMutation();
  const [pauseWorkoutSession] = usePauseWorkoutSessionMutation();
  const [resumeWorkoutSession] = useResumeWorkoutSessionMutation();
  const [cancelWorkoutSession] = useCancelWorkoutSessionMutation();

  const exercises = workout?.workoutExercises ?? [];
  const currentExercise = exercises[currentExerciseIndex];
  const totalSets = Math.max(Number(currentExercise?.sets ?? 1), 1);
  const isTimed = !currentExercise?.reps && !!currentExercise?.duration;

  const totalSetsInWorkout = useMemo(
    () => exercises.reduce((sum: number, ex: any) => sum + Math.max(Number(ex?.sets ?? 1), 1), 0),
    [exercises],
  );
  const setsCompleted = setsLogged;
  const progress = totalSetsInWorkout > 0 ? setsCompleted / totalSetsInWorkout : 0;

  useEffect(() => {
    const initialise = async () => {
      if (!workout?.id || activeSessionLoading || sessionId) return;

      const active = activeSessionData?.status ? activeSessionData.data?.session : null;
      const loggedProgress = (
        activeSessionData?.status ? activeSessionData.data?.progress ?? [] : []
      ) as any[];

      if (active && String(active.workoutId) === String(workout.id)) {
        setSessionId(active.id);
        setSessionSeconds(Number(active.totalDuration) || 0);

        setSetsLogged(loggedProgress.length);

        const doneByExercise = new Map<string, number>();
        loggedProgress.forEach((row) => {
          const key = String(row?.workoutExerciseId);
          doneByExercise.set(key, (doneByExercise.get(key) ?? 0) + 1);
        });

        const resumeAt = exercises.findIndex((ex: any) => {
          const planned = Math.max(Number(ex?.sets ?? 1), 1);
          return (doneByExercise.get(String(ex?.id)) ?? 0) < planned;
        });

        if (resumeAt === -1) {
          const last = Math.max(exercises.length - 1, 0);
          setCurrentExerciseIndex(last);
          setCurrentSet(Math.max(Number(exercises[last]?.sets ?? 1), 1));
        } else {
          setCurrentExerciseIndex(resumeAt);
          setCurrentSet((doneByExercise.get(String(exercises[resumeAt]?.id)) ?? 0) + 1);
        }
        return;
      }

      const result = await startWorkoutSession({ workoutId: workout.id });
      if (result.data?.status) {
        setSessionId(result.data.data.id);
        return;
      }

      const serverMessage =
        (result as any)?.error?.data?.message ||
        result.data?.message ||
        'Could not start this workout.';

      const openSession = activeSessionData?.status
        ? activeSessionData.data?.session
        : null;

      if (openSession && /active workout session/i.test(serverMessage)) {
        Alert.alert(
          'Another workout is still open',
          `${serverMessage}\n\nDiscard it and start this one instead?`,
          [
            { text: 'Keep it', style: 'cancel', onPress: () => navigation.goBack() },
            {
              text: 'Discard & start',
              style: 'destructive',
              onPress: async () => {
                try {
                  await cancelWorkoutSession({ sessionId: openSession.id }).unwrap();
                  const retry = await startWorkoutSession({ workoutId: workout.id });
                  if (retry.data?.status) {
                    setSessionId(retry.data.data.id);
                    return;
                  }
                  throw new Error('retry failed');
                } catch {
                  Alert.alert('Error', 'Could not start this workout.', [
                    { text: 'OK', onPress: () => navigation.goBack() },
                  ]);
                }
              },
            },
          ],
        );
        return;
      }

      Alert.alert('Could not start this workout', serverMessage, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    };

    initialise();
  }, [workout?.id, activeSessionData, activeSessionLoading, sessionId]);

  useEffect(() => {
    if (!isSessionActive) return;
    const id = setInterval(() => setSessionSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isSessionActive]);

  useEffect(() => {
    if (!isResting) return;
    if (restTimeLeft <= 0) {
      finishRest();
      return;
    }
    const id = setInterval(() => setRestTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [isResting, restTimeLeft]);

  useEffect(() => {
    setRepsInput(currentExercise?.reps ? String(currentExercise.reps) : '');
    setWeightInput('');
  }, [currentExerciseIndex, currentSet, currentExercise?.reps]);

  const finishRest = () => {
    setIsResting(false);
    setRestTimeLeft(0);
    if (advanceAfterRest) {
      setAdvanceAfterRest(false);
      setCurrentExerciseIndex((i) => i + 1);
      setCurrentSet(1);
    }
  };

  const beginRest = (advance: boolean) => {
    const rest = Number(currentExercise?.restTime) || 0;
    if (rest > 0) {
      setAdvanceAfterRest(advance);
      setRestTimeLeft(rest);
      setIsResting(true);
      return;
    }
    if (advance) {
      setCurrentExerciseIndex((i) => i + 1);
      setCurrentSet(1);
    }
  };

  const handleStartPause = async () => {
    if (!sessionId) return;

    try {
      if (isSessionActive) {
        setIsSessionActive(false);
        await pauseWorkoutSession({ sessionId });
      } else {
        if (hasWorkoutStarted) {
          await resumeWorkoutSession({ sessionId });
        }
        setIsSessionActive(true);
        setHasWorkoutStarted(true);
      }
    } catch {
      Alert.alert('Error', 'Could not update the session. Please try again.');
    }
  };

  const handleCompleteSet = async () => {
    if (!sessionId || !currentExercise || isLoggingSet) return;

    const reps = parseInt(repsInput, 10);
    const weight = parseFloat(weightInput);

    if (!isTimed && (!Number.isFinite(reps) || reps <= 0)) {
      Alert.alert('Reps needed', 'Enter how many reps you completed for this set.');
      return;
    }

    try {
      const res = await completeExercise({
        sessionId,
        workoutExerciseId: currentExercise.id,
        setNumber: currentSet,
        repsCompleted: Number.isFinite(reps) && reps > 0 ? reps : undefined,
        durationCompleted: isTimed ? currentExercise.duration : undefined,
        weightUsed: Number.isFinite(weight) && weight > 0 ? weight : undefined,
      }).unwrap();

      if (!res?.status) {
        Alert.alert('Error', res?.message || 'Could not save that set.');
        return;
      }

      const loggedNow = setsLogged + 1;
      setSetsLogged(loggedNow);

      const isLastSet = currentSet >= totalSets;
      const isLastExercise = currentExerciseIndex >= exercises.length - 1;

      if (!isLastSet) {
        setCurrentSet((s) => s + 1);
        beginRest(false);
        return;
      }

      if (!isLastExercise) {
        beginRest(true);
        return;
      }

      await finishWorkout(false, loggedNow);
    } catch (error: any) {
      Alert.alert('Error', error?.data?.message || 'Could not save that set.');
    }
  };

  const finishWorkout = async (fromDialog: boolean, loggedOverride?: number) => {
    if (!sessionId) return;

    try {
      const result = await completeWorkoutSession({ sessionId });
      if (fromDialog) setShowFinishDialog(false);
      setIsSessionActive(false);

      if (!result.data?.status) {
        Alert.alert('Error', 'Could not finish the workout. Please try again.');
        return;
      }

      Alert.alert(
        'Workout complete',
        `${loggedOverride ?? setsCompleted} of ${totalSetsInWorkout} sets · ${formatTime(sessionSeconds)}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch {
      if (fromDialog) setShowFinishDialog(false);
      Alert.alert('Error', 'Could not finish the workout. Please try again.');
    }
  };

  if (workoutLoading || !workout) {
    return (
      <SafeAreaView edges={[]} style={styles.container}>
        <BasicTopBar
          onBackPress={() => navigation.goBack()}
          title="Workout Session"
          subtitle="Loading..."
          containerStyle={{ paddingTop: DIMENSIONS.spacing.xxl, paddingBottom: DIMENSIONS.spacing.lg }}
        />
        <View style={styles.loadingContainer}>
          <Text style={{ color: COLORS.textSecondary }}>Loading workout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <BasicTopBar
        onBackPress={() => navigation.goBack()}
        title={workout.title}
        subtitle="Stay focused and push yourself"
        containerStyle={{ paddingTop: DIMENSIONS.spacing.xxl, paddingBottom: DIMENSIONS.spacing.lg }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>Session Time</Text>
          <Text style={styles.timerDisplay}>{formatTime(sessionSeconds)}</Text>

          <View style={styles.timerControls}>
            <TouchableOpacity
              style={[styles.controlButton, styles.primaryButton]}
              onPress={handleStartPause}
              activeOpacity={0.8}
            >
              <Ionicons name={isSessionActive ? 'pause' : 'play'} size={24} color={COLORS.black} />
              <Text style={styles.primaryButtonText}>{isSessionActive ? 'Pause' : hasWorkoutStarted ? 'Resume' : 'Start'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.secondaryButton]}
              onPress={() => setShowFinishDialog(true)}
              activeOpacity={0.8}
              disabled={!hasWorkoutStarted}
            >
              <Ionicons name="checkmark" size={24} color={COLORS.primary} />
              <Text style={styles.secondaryButtonText}>Finish</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.exercisesContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {setsCompleted} of {totalSetsInWorkout} sets
          </Text>
        </View>

        {currentExercise && (
          <View style={styles.exerciseContainer}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.sectionTitle}>Current Exercise</Text>
              <Text style={styles.exerciseOrder}>
                Exercise {currentExerciseIndex + 1}/{exercises.length}
              </Text>
            </View>

            <View style={styles.exerciseCard}>
              <View style={styles.exerciseNumber}>
                <Text style={styles.exerciseNumberText}>{currentExerciseIndex + 1}</Text>
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{currentExercise.exercise?.name}</Text>
                <Text style={styles.exerciseDetail}>
                  {`Set ${Math.min(currentSet, totalSets)} of ${totalSets}`}
                  {currentExercise.reps ? ` · target ${currentExercise.reps} reps` : ''}
                  {currentExercise.duration ? ` · ${currentExercise.duration}s` : ''}
                </Text>
              </View>
            </View>

            {isResting ? (
              <View style={styles.restContainer}>
                <Text style={styles.restTitle}>Rest</Text>
                <Text style={styles.restTimer}>{formatTime(restTimeLeft)}</Text>
                <TouchableOpacity style={styles.skipRestButton} onPress={finishRest} activeOpacity={0.8}>
                  <Text style={styles.skipRestText}>Skip Rest</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.setInputsRow}>
                  <View style={styles.setInputBlock}>
                    <Text style={styles.setInputLabel}>Reps</Text>
                    <TextInput
                      style={styles.setInput}
                      value={repsInput}
                      onChangeText={setRepsInput}
                      keyboardType="number-pad"
                      placeholder={currentExercise.reps ? String(currentExercise.reps) : '—'}
                      placeholderTextColor={COLORS.textSecondary}
                      editable={!isTimed}
                    />
                  </View>
                  <View style={styles.setInputBlock}>
                    <Text style={styles.setInputLabel}>Weight (kg)</Text>
                    <TextInput
                      style={styles.setInput}
                      value={weightInput}
                      onChangeText={setWeightInput}
                      keyboardType="decimal-pad"
                      placeholder="Bodyweight"
                      placeholderTextColor={COLORS.textSecondary}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.completeButton, (!hasWorkoutStarted || isLoggingSet) && styles.completeButtonDisabled]}
                  onPress={handleCompleteSet}
                  disabled={!hasWorkoutStarted || isLoggingSet}
                  activeOpacity={0.8}
                >
                  <Text style={styles.completeButtonText}>
                    {isLoggingSet
                      ? 'Saving...'
                      : currentSet >= totalSets
                        ? 'Complete Exercise'
                        : `Log Set ${currentSet}`}
                  </Text>
                </TouchableOpacity>
                {!hasWorkoutStarted && (
                  <Text style={styles.startHint}>Press Start to begin logging sets.</Text>
                )}
              </>
            )}
          </View>
        )}

        {exercises.length > currentExerciseIndex + 1 && (
          <View style={styles.exercisesContainer}>
            <Text style={styles.sectionTitle}>Upcoming Exercises</Text>
            {exercises.slice(currentExerciseIndex + 1).map((exercise: any, index: number) => (
              <View key={exercise.id} style={styles.exerciseCard}>
                <View style={styles.exerciseNumber}>
                  <Text style={styles.exerciseNumberText}>{currentExerciseIndex + index + 2}</Text>
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.exercise?.name}</Text>
                  <Text style={styles.exerciseDetail}>
                    {`${Math.max(Number(exercise.sets ?? 1), 1)} sets`}
                    {exercise.reps ? ` × ${exercise.reps} reps` : ''}
                    {exercise.restTime ? ` · rest ${exercise.restTime}s` : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <ConfirmationDialog
        visible={showFinishDialog}
        title="End Workout"
        message="Are you sure you want to end this workout session?"
        confirmLabel="End"
        cancelLabel="Cancel"
        confirmButtonColor={COLORS.primary}
        confirmTextColor={COLORS.black}
        onConfirm={() => finishWorkout(true)}
        onCancel={() => setShowFinishDialog(false)}
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
  },
  scrollContent: {
    paddingTop: DIMENSIONS.spacing.md,
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingBottom: DIMENSIONS.spacing.xxl,
  },
  timerContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: DIMENSIONS.spacing.xl,
    marginBottom: DIMENSIONS.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  timerLabel: {
    fontSize: 14,
    fontFamily: FontWeight.Medium,
    color: COLORS._616888,
    marginBottom: DIMENSIONS.spacing.sm,
  },
  timerDisplay: {
    fontSize: 48,
    fontFamily: FontWeight.Bold,
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.lg,
  },
  timerControls: {
    flexDirection: 'row',
    gap: DIMENSIONS.spacing.md,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DIMENSIONS.spacing.md,
    paddingHorizontal: DIMENSIONS.spacing.xl,
    borderRadius: 8,
    gap: DIMENSIONS.spacing.sm,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.black,
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.primary,
  },
  infoContainer: {
    marginBottom: DIMENSIONS.spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    gap: DIMENSIONS.spacing.sm,
  },
  infoCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: DIMENSIONS.spacing.md,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: FontWeight.Medium,
    color: COLORS._616888,
    marginTop: DIMENSIONS.spacing.xs,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
    marginTop: 4,
    textAlign: 'center',
  },
  exercisesContainer: {
    marginBottom: DIMENSIONS.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.md,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: DIMENSIONS.spacing.md,
    marginBottom: DIMENSIONS.spacing.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DIMENSIONS.spacing.md,
  },
  exerciseNumberText: {
    fontSize: 14,
    fontFamily: FontWeight.Bold,
    color: COLORS.black,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
    marginBottom: 4,
  },
  exerciseDetail: {
    fontSize: 14,
    fontFamily: FontWeight.Regular,
    color: COLORS._616888,
  },
  checkButton: {
    padding: DIMENSIONS.spacing.xs,
  },
  finishButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: DIMENSIONS.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  finishButtonText: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.black,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseContainer: {
    marginBottom: DIMENSIONS.spacing.lg,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DIMENSIONS.spacing.md,
  },
  exerciseOrder: {
    fontSize: 14,
    fontFamily: FontWeight.Medium,
    color: COLORS._616888,
  },
  exerciseDetails: {
    marginBottom: DIMENSIONS.spacing.md,
  },
  restContainer: {
    alignItems: 'center',
    padding: DIMENSIONS.spacing.md,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  restTitle: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.primary,
    marginBottom: DIMENSIONS.spacing.sm,
  },
  restTimer: {
    fontSize: 24,
    fontFamily: FontWeight.Bold,
    color: COLORS.primary,
  },
  completeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: DIMENSIONS.spacing.md,
    alignItems: 'center',
    marginTop: DIMENSIONS.spacing.md,
  },
  completeButtonText: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.black,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginBottom: DIMENSIONS.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontFamily: FontWeight.Medium,
    color: COLORS._616888,
    textAlign: 'center',
  },
  completeButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  startHint: {
    fontSize: 13,
    fontFamily: FontWeight.Regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: DIMENSIONS.spacing.sm,
  },
  skipRestButton: {
    marginTop: DIMENSIONS.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: DIMENSIONS.spacing.sm,
    paddingHorizontal: DIMENSIONS.spacing.lg,
  },
  skipRestText: {
    fontSize: 14,
    fontFamily: FontWeight.Medium,
    color: COLORS.text,
  },
  setInputsRow: {
    flexDirection: 'row',
    gap: DIMENSIONS.spacing.md,
    marginTop: DIMENSIONS.spacing.md,
  },
  setInputBlock: {
    flex: 1,
  },
  setInputLabel: {
    fontSize: 12,
    fontFamily: FontWeight.Medium,
    color: COLORS.textSecondary,
    marginBottom: DIMENSIONS.spacing.xs,
  },
  setInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    paddingHorizontal: DIMENSIONS.spacing.md,
    paddingVertical: DIMENSIONS.spacing.sm,
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
  },
});

export default WorkoutSessionScreen;
