import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, DIMENSIONS } from '../config/constants';
import BasicTopBar from '../components/BasicTopBar';
import ConfirmationDialog from '../components/ConfirmationDialog';
import FontWeight from '../hooks/useInterFonts';
import type { Workout, UserWorkoutSession, WorkoutExercise } from '../types';
import { 
  useStartWorkoutSessionMutation,
  useGetActiveWorkoutSessionQuery,
  useCompleteExerciseMutation,
  useCompleteWorkoutSessionMutation,
  usePauseWorkoutSessionMutation,
  useResumeWorkoutSessionMutation,
  useGetWorkoutByIdQuery,
} from '../services/api/workoutApi';

interface WorkoutSessionScreenProps {
  navigation: any;
  route: any;
}

const WorkoutSessionScreen: React.FC<WorkoutSessionScreenProps> = ({ navigation, route }) => {
  const { workout: initialWorkout } = route.params as { workout: Workout };
  
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [currentSessionStartTime, setCurrentSessionStartTime] = useState<Date | null>(null);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [hasWorkoutStarted, setHasWorkoutStarted] = useState(false);

  // Fetch complete workout data with exercises
  const { data: workoutResponse, isLoading: workoutLoading } = useGetWorkoutByIdQuery(initialWorkout.id);
  const workout = workoutResponse?.status ? workoutResponse.data : initialWorkout;

  // Debug workout data changes
  useEffect(() => {
    console.log('Workout data:', workout);
    console.log('Workout exercises:', workout?.workoutExercises);
  }, [workout]);

  // API hooks
  const [startWorkoutSession] = useStartWorkoutSessionMutation();
  const { data: activeSessionData, isLoading: activeSessionLoading, error: activeSessionError } = useGetActiveWorkoutSessionQuery(undefined);
  const [completeExercise] = useCompleteExerciseMutation();
  const [completeWorkoutSession] = useCompleteWorkoutSessionMutation();
  const [pauseWorkoutSession] = usePauseWorkoutSessionMutation();
  const [resumeWorkoutSession] = useResumeWorkoutSessionMutation();

  // Initialize session on mount
  useEffect(() => {
    const initializeSession = async () => {
      console.log('initializeSession called');
      console.log('workout:', workout);
      console.log('workout?.id:', workout?.id);
      console.log('activeSessionLoading:', activeSessionLoading);

      if (!workout?.id || activeSessionLoading) {
        console.log('Early return - no workout id or still loading');
        return;
      }

      console.log('Initializing session for workout:', workout.id);

      try {
        // Check if there's already an active session
        console.log('Checking for active session...');
        console.log('Active session data:', JSON.stringify(activeSessionData, null, 2));
        console.log('Active session loading:', activeSessionLoading);
        console.log('Active session error:', activeSessionError);

        if (activeSessionData?.status && activeSessionData.data?.session && !activeSessionError) {
          console.log('✅ Condition met: activeSessionData?.status =', activeSessionData?.status);
          console.log('✅ Condition met: activeSessionData.data.session exists =', !!activeSessionData.data.session);
          console.log('✅ Condition met: !activeSessionError =', !activeSessionError);
          console.log('Found active session:', activeSessionData.data.session);
          console.log('Session ID from active session:', activeSessionData.data.session.id);
          setSessionId(activeSessionData.data.session.id);
          setCurrentSessionStartTime(new Date(activeSessionData.data.session.startedAt));
        } else {
          console.log('❌ Condition NOT met:');
          console.log('  - activeSessionData?.status =', activeSessionData?.status);
          console.log('  - activeSessionData exists =', !!activeSessionData);
          if (activeSessionData && 'data' in activeSessionData) {
            console.log('  - activeSessionData.data =', activeSessionData.data);
            console.log('  - activeSessionData.data.session =', activeSessionData.data?.session);
          } else {
            console.log('  - activeSessionData is error response or null');
          }
          console.log('  - activeSessionError =', activeSessionError);
          console.log('No active session found, starting new one...');
          // Start a new session
          const result = await startWorkoutSession({ workoutId: workout.id });
          console.log('Start session result:', result);
          if (result.data?.status) {
            console.log('Session started successfully:', result.data.data);
            setSessionId(result.data.data.id);
            setCurrentSessionStartTime(new Date());
          } else {
            console.log('Failed to start session:', result.error);
            Alert.alert('Error', 'Failed to start workout session. Please try again.');
            navigation.goBack();
          }
        }
      } catch (error) {
        console.log('Error initializing session:', error);
        Alert.alert('Error', 'Failed to initialize workout session');
        navigation.goBack();
      }
    };

    if (workout && !activeSessionLoading) {
      initializeSession();
    }
  }, [workout?.id, activeSessionData, activeSessionLoading]);

  // Debug sessionId changes
  useEffect(() => {
    console.log('sessionId changed:', sessionId);
  }, [sessionId]);

  // Timer for session duration
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSessionActive && currentSessionStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - currentSessionStartTime.getTime()) / 1000);
        setSessionSeconds(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive, currentSessionStartTime]);

  // Rest timer
  useEffect(() => {
    let restInterval: NodeJS.Timeout;
    if (isResting && restTimeLeft > 0) {
      restInterval = setInterval(() => {
        setRestTimeLeft(prev => {
          if (prev <= 1) {
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(restInterval);
  }, [isResting, restTimeLeft]);

  // Format time as HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStartPause = async () => {
    console.log('handleStartPause called, sessionId:', sessionId);
    if (!sessionId) {
      console.log('No sessionId, returning');
      return;
    }

    try {
      if (isSessionActive) {
        console.log('Pausing session');
        await pauseWorkoutSession({ sessionId });
        setIsSessionActive(false);
      } else {
        console.log('Starting/resuming session');
        if (activeSessionData?.status && activeSessionData.data?.session?.status === 'paused') {
          console.log('Resuming paused session');
          await resumeWorkoutSession({ sessionId });
        }
        setIsSessionActive(true);
        setHasWorkoutStarted(true);
        setCurrentSessionStartTime(new Date());
      }
    } catch (error) {
      console.log('Error in handleStartPause:', error);
      Alert.alert('Error', 'Failed to update session status');
    }
  };

  const handleCompleteExercise = async () => {
    console.log('handleCompleteExercise called');
    console.log('sessionId:', sessionId);
    console.log('workout:', workout);
    console.log('currentExerciseIndex:', currentExerciseIndex);

    if (!sessionId || !workout.workoutExercises) {
      console.log('Missing sessionId or workout exercises');
      return;
    }

    const currentExercise = workout.workoutExercises[currentExerciseIndex];
    console.log('currentExercise:', currentExercise);

    if (!currentExercise) {
      console.log('No current exercise found');
      return;
    }

    try {
      console.log('Completing exercise:', {
        sessionId,
        workoutExerciseId: currentExercise.id,
        setNumber: 1,
        repsCompleted: currentExercise.reps || undefined,
        durationCompleted: currentExercise.duration || undefined,
      });

      await completeExercise({
        sessionId,
        workoutExerciseId: currentExercise.id,
        setNumber: 1, // For now, assuming single set per exercise
        repsCompleted: currentExercise.reps || undefined,
        durationCompleted: currentExercise.duration || undefined,
      });

      console.log('Exercise completed successfully');

      // Start rest timer
      setRestTimeLeft(currentExercise.restTime);
      setIsResting(true);

      // Move to next exercise or complete workout
      if (currentExerciseIndex < workout.workoutExercises.length - 1) {
        console.log('Moving to next exercise');
        setCurrentExerciseIndex(prev => prev + 1);
      } else {
        console.log('Completing workout');
        // Complete the workout
        await handleConfirmFinish(false);
      }
    } catch (error) {
      console.log('Error completing exercise:', error);
      Alert.alert('Error', 'Failed to complete exercise');
    }
  };



  const handleFinish = () => {
    setShowFinishDialog(true);
  };

  const handleConfirmFinish = async (showDialog = true) => {
    console.log('handleConfirmFinish called with sessionId:', sessionId);
    if (!sessionId) {
      console.log('No sessionId, cannot complete workout');
      return;
    }

    try {
      console.log('Calling completeWorkoutSession API...');
      const result = await completeWorkoutSession({ sessionId });
      console.log('Complete workout result:', result);

      if (result.data?.status) {
        console.log('Workout completed successfully:', result.data.data);
      } else {
        console.log('Failed to complete workout:', result.error);
      }

      if (showDialog) {
        setShowFinishDialog(false);
        Alert.alert('Congratulations!', 'Workout completed successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        // Auto-completed workout
        Alert.alert('Congratulations!', 'Workout completed successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.log('Error completing workout session:', error);
      if (showDialog) {
        setShowFinishDialog(false);
      }
      Alert.alert('Error', 'Failed to complete workout');
    }
  };

  const handleCancelFinish = () => {
    setShowFinishDialog(false);
  };

  if (workoutLoading || !workout) {
    return (
      <SafeAreaView edges={[]} style={styles.container}>
        <BasicTopBar
          onBackPress={() => navigation.goBack()}
          title="Workout Session"
          subtitle="Loading..."
        />
        <View style={styles.loadingContainer}>
          <Text>Loading workout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentExercise = workout.workoutExercises?.[currentExerciseIndex];

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
      >
        {/* Timer Section */}
        <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>Session Time</Text>
          <Text style={styles.timerDisplay}>{formatTime(sessionSeconds)}</Text>
          
          <View style={styles.timerControls}>
            <TouchableOpacity 
              style={[styles.controlButton, styles.primaryButton]}
              onPress={() => {
                console.log('Start/Pause button pressed');
                handleStartPause();
              }}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={isSessionActive ? 'pause' : 'play'} 
                size={24} 
                color={COLORS.white} 
              />
              <Text style={styles.primaryButtonText}>
                {isSessionActive ? 'Pause' : 'Start'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.controlButton, styles.secondaryButton]}
              onPress={hasWorkoutStarted ? handleFinish : undefined}
              activeOpacity={0.8}
              disabled={!hasWorkoutStarted}
            >
              <Ionicons name="checkmark" size={24} color={COLORS.primary} />
              <Text style={styles.secondaryButtonText}>Finish</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Current Exercise */}
        {currentExercise && (
          <View style={styles.exerciseContainer}>
            <Text style={styles.sectionTitle}>Current Exercise</Text>
            <View style={styles.exerciseCard}>
              <View style={styles.exerciseNumber}>
                <Text style={styles.exerciseNumberText}>{currentExerciseIndex + 1}</Text>
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{currentExercise.exercise?.name}</Text>
                <Text style={styles.exerciseDetail}>
                  {currentExercise.reps ? `${currentExercise.reps} reps` : currentExercise.duration ? `${currentExercise.duration}s` : ''}
                  {currentExercise.restTime ? ` • Rest: ${currentExercise.restTime}s` : ''}
                </Text>
              </View>
            </View>

            {isResting ? (
              <View style={styles.restContainer}>
                <Text style={styles.restTitle}>Rest Time</Text>
                <Text style={styles.restTimer}>{formatTime(restTimeLeft)}</Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.completeButton}
                onPress={() => {
                  console.log('Complete exercise button pressed');
                  handleCompleteExercise();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.completeButtonText}>Complete Exercise</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Upcoming Exercises */}
        {workout.workoutExercises && workout.workoutExercises.length > currentExerciseIndex + 1 && (
          <View style={styles.exercisesContainer}>
            <Text style={styles.sectionTitle}>Upcoming Exercises</Text>
            {workout.workoutExercises.slice(currentExerciseIndex + 1).map((exercise, index) => (
              <View key={exercise.id} style={styles.exerciseCard}>
                <View style={styles.exerciseNumber}>
                  <Text style={styles.exerciseNumberText}>{currentExerciseIndex + index + 2}</Text>
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.exercise?.name}</Text>
                  <Text style={styles.exerciseDetail}>
                    {exercise.reps ? `${exercise.reps} reps` : exercise.duration ? `${exercise.duration}s` : ''}
                    {exercise.restTime ? ` • Rest: ${exercise.restTime}s` : ''}
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
        confirmTextColor={COLORS.white}
        onConfirm={handleConfirmFinish}
        onCancel={handleCancelFinish}
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
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: DIMENSIONS.spacing.xl,
    marginBottom: DIMENSIONS.spacing.lg,
    alignItems: 'center',
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
    color: COLORS.gradient1,
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
    color: COLORS.white,
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
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
    backgroundColor: COLORS.white,
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
    color: COLORS.gradient1,
    marginTop: 4,
    textAlign: 'center',
  },
  exercisesContainer: {
    marginBottom: DIMENSIONS.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.gradient1,
    marginBottom: DIMENSIONS.spacing.md,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: DIMENSIONS.spacing.md,
    marginBottom: DIMENSIONS.spacing.sm,
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
    color: COLORS.white,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.gradient1,
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
    color: COLORS.white,
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
    color: COLORS.white,
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
});

export default WorkoutSessionScreen;

