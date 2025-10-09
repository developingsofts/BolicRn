import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, DIMENSIONS } from '../config/constants';
import BasicTopBar from '../components/BasicTopBar';
import FontWeight from '../hooks/useInterFonts';

interface WorkoutSessionScreenProps {
  navigation: any;
  route: any;
}

const WorkoutSessionScreen: React.FC<WorkoutSessionScreenProps> = ({ navigation, route }) => {
  const { workoutType, workoutName } = route.params || {};
  
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Format time as HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setSeconds(0);
    setIsRunning(false);
  };

  const handleFinish = () => {
    // Navigate to workout summary or back
    navigation.goBack();
  };

  // Mock workout details
  const workoutDetails = {
    exercises: [
      { name: 'Warm Up', duration: '5 min', completed: false },
      { name: 'Main Exercise', sets: '3 sets x 12 reps', completed: false },
      { name: 'Secondary Exercise', sets: '3 sets x 10 reps', completed: false },
      { name: 'Cool Down', duration: '5 min', completed: false },
    ],
    difficulty: 'Intermediate',
    estimatedTime: '45 min',
    calories: '300-400 kcal',
  };

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <BasicTopBar
        onBackPress={() => navigation.goBack()}
        title={workoutName || 'Workout Session'}
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
          <Text style={styles.timerDisplay}>{formatTime(seconds)}</Text>
          
          <View style={styles.timerControls}>
            <TouchableOpacity 
              style={[styles.controlButton, styles.primaryButton]}
              onPress={handleStartPause}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={isRunning ? 'pause' : 'play'} 
                size={24} 
                color={COLORS.white} 
              />
              <Text style={styles.primaryButtonText}>
                {isRunning ? 'Pause' : 'Start'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.controlButton, styles.secondaryButton]}
              onPress={handleReset}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={24} color={COLORS.primary} />
              <Text style={styles.secondaryButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Workout Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <View style={styles.infoCard}>
              <Ionicons name="barbell-outline" size={24} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Difficulty</Text>
              <Text style={styles.infoValue}>{workoutDetails.difficulty}</Text>
            </View>
            <View style={styles.infoCard}>
              <Ionicons name="time-outline" size={24} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>{workoutDetails.estimatedTime}</Text>
            </View>
            <View style={styles.infoCard}>
              <Ionicons name="flame-outline" size={24} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Calories</Text>
              <Text style={styles.infoValue}>{workoutDetails.calories}</Text>
            </View>
          </View>
        </View>

        {/* Exercise List */}
        <View style={styles.exercisesContainer}>
          <Text style={styles.sectionTitle}>Exercises</Text>
          {workoutDetails.exercises.map((exercise, index) => (
            <View key={index} style={styles.exerciseCard}>
              <View style={styles.exerciseNumber}>
                <Text style={styles.exerciseNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseDetail}>
                  {exercise.duration || exercise.sets}
                </Text>
              </View>
              <TouchableOpacity style={styles.checkButton}>
                <Ionicons 
                  name={exercise.completed ? 'checkmark-circle' : 'ellipse-outline'} 
                  size={28} 
                  color={exercise.completed ? COLORS.primary : COLORS._616888} 
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Finish Button */}
        <TouchableOpacity 
          style={styles.finishButton}
          onPress={handleFinish}
          activeOpacity={0.8}
        >
          <Text style={styles.finishButtonText}>Finish Workout</Text>
        </TouchableOpacity>
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
});

export default WorkoutSessionScreen;

