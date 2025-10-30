import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, DIMENSIONS } from '../config/constants';
import BasicTopBar from '../components/BasicTopBar';
import FontWeight from '../hooks/useInterFonts';
import { WeightLifting, StrengthTraining, Cardio, BuddhistGym, Gym1, Man } from '../../assets';
import { useGetWorkoutsQuery } from '../services/api/workoutApi';
import type { Workout } from '../types';

const { width: screenWidth } = Dimensions.get('window');
const cardGap = DIMENSIONS.spacing.md;
const horizontalPadding = DIMENSIONS.spacing.lg * 2;
const cardWidth = (screenWidth - horizontalPadding - cardGap) / 2;

interface SelectWorkoutScreenProps {
  navigation: any;
}

const SelectWorkoutScreen: React.FC<SelectWorkoutScreenProps> = ({ navigation }) => {
  const { data: workoutsResponse, isLoading, error } = useGetWorkoutsQuery();

  console.log('Workouts query state:', { isLoading, error, data: workoutsResponse });

  const getWorkoutImage = (type: string) => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('cardio')) {
      return Cardio;
    } else if (typeLower.includes('yoga')) {
      return BuddhistGym;
    } else if (typeLower.includes('legs')) {
      return Man;
    } else if (typeLower.includes('chest')) {
      return StrengthTraining;
    } else if (typeLower.includes('back')) {
      return WeightLifting;
    } else if (typeLower.includes('shoulders')) {
      return Gym1;
    } else if (typeLower.includes('arms')) {
      return WeightLifting;
    } else if (typeLower.includes('core')) {
      return Gym1;
    } else if (typeLower.includes('hiit')) {
      return StrengthTraining;
    } else {
      return Man; // default
    }
  };

  const handleWorkoutSelect = (workout: Workout) => {
    // Navigate to workout session with selected workout
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

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <BasicTopBar
        onBackPress={() => navigation.goBack()}
        title="Select Your Workout"
        subtitle="Let's start something..."
        containerStyle={{ paddingTop: DIMENSIONS.spacing.xxl, paddingBottom: DIMENSIONS.spacing.lg }}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {workouts.map((workout) => (
            <TouchableOpacity
              key={workout.id}
              style={styles.card}
              onPress={() => handleWorkoutSelect(workout)}
              activeOpacity={0.8}
            >
              <View style={styles.iconContainer}>
                <Image
                  source={getWorkoutImage(workout.type)}
                  style={styles.workoutImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">{workout.title}</Text>
              <Text style={styles.cardSubtitle}>{workout.type}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: DIMENSIONS.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 140,
    marginBottom: cardGap,
  },
  iconContainer: {
    marginBottom: DIMENSIONS.spacing.md,
  },
  workoutImage: {
    width: 60,
    height: 60,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FontWeight.SemiBold,
    color: COLORS.gradient1,
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
