
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BasicTopBar from '../components/BasicTopBar';
import { COLORS, DIMENSIONS } from '../config/constants';
import FontWeight from '../hooks/useInterFonts';

const workouts = [
  {
    id: '1',
    title: 'Lower Body Endurance',
    category: 'Cardio',
    categoryColor: COLORS._D2E7FF, // All workout badges bg
    duration: '30 mins',
    intensity: 'High',
    completedDate: 'Today',
  },
  {
    id: '2',
    title: 'Upper Body Power',
    category: 'Strength',
    categoryColor: COLORS._D2E7FF,
    duration: '45 mins',
    intensity: 'Medium',
    completedDate: 'Yesterday',
  },
  {
    id: '3',
    title: 'Core Stability',
    category: 'Flexibility',
    categoryColor: COLORS._D2E7FF,
    duration: '25 mins',
    intensity: 'Low',
    completedDate: 'Last Week',
  },
];

const WorkoutHistory: React.FC = ({ navigation }: any) => {
  const handleStartWorkout = () => {
    // TODO: Navigate to start workout screen
    console.log('Start new workout');
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

        {/* Workouts List */}
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
    paddingVertical: 20,
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
    fontFamily: FontWeight.SemiBold,
    fontSize: 16,
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
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginRight: 6,
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
    marginRight: 8,
  },
  completedText: {
    color: COLORS._5E5E5E,
    fontSize: 14,
    fontFamily: FontWeight.Regular,
  },
  postButton: {
    marginLeft: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00000033',
    backgroundColor: COLORS.white,
    alignSelf: 'flex-start',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  postButtonText: {
    color: COLORS.app_black,
    fontFamily: FontWeight.Medium,
    fontSize: 14,
  },
});

export default WorkoutHistory;
