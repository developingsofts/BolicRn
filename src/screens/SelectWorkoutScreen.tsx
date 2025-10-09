import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, DIMENSIONS } from '../config/constants';
import BasicTopBar from '../components/BasicTopBar';
import FontWeight from '../hooks/useInterFonts';
import { WeightLifting, StrengthTraining, Cardio, BuddhistGym, Gym1, Man } from '../../assets';

const { width: screenWidth } = Dimensions.get('window');
const cardGap = DIMENSIONS.spacing.md;
const horizontalPadding = DIMENSIONS.spacing.lg * 2;
const cardWidth = (screenWidth - horizontalPadding - cardGap) / 2;

interface SelectWorkoutScreenProps {
  navigation: any;
}

const SelectWorkoutScreen: React.FC<SelectWorkoutScreenProps> = ({ navigation }) => {
  const workoutTypes = [
    { id: 'powerlifting', name: 'Power Lifting', image: Man },
    { id: 'bodybuilding', name: 'Body Building', image: Gym1 },
    { id: 'strength', name: 'Strength Training', image: StrengthTraining },
    { id: 'cardio', name: 'Cardio', image: Cardio },
    { id: 'yoga', name: 'Yoga', image: BuddhistGym },
    { id: 'crossfit', name: 'CrossFit', image: WeightLifting },
  ];

  const handleWorkoutSelect = (workoutId: string, workoutName: string) => {
    // Navigate to workout session with selected workout type
    navigation.navigate('WorkoutSession', {
      workoutType: workoutId,
      workoutName: workoutName,
    });
  };

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
          {workoutTypes.map((workout) => (
            <TouchableOpacity
              key={workout.id}
              style={styles.card}
              onPress={() => handleWorkoutSelect(workout.id, workout.name)}
              activeOpacity={0.8}
            >
              <View style={styles.iconContainer}>
                <Image 
                  source={workout.image}
                  style={styles.workoutImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.cardTitle}>{workout.name}</Text>
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
    padding: DIMENSIONS.spacing.xl,
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
  },
});

export default SelectWorkoutScreen;
