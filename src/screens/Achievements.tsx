import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BasicTopBar from '../components/BasicTopBar';
import { COLORS, DIMENSIONS } from '../config/constants';
import FontWeight from '../hooks/useInterFonts';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

const achievements = [
  {
    id: '1',
    icon: '👣',
    title: 'First Steps',
    description: 'Complete your first workout',
    progress: 10,
    maxProgress: 10,
    unlocked: true,
  },
  {
    id: '2',
    icon: '⚡',
    title: 'Week Warrior',
    description: 'Workout 7 Days in a Row',
    progress: 6,
    maxProgress: 10,
    unlocked: true,
  },
  {
    id: '3',
    icon: '⚡',
    title: 'Week Warrior',
    description: 'Workout 7 Days in a Row',
    progress: 4,
    maxProgress: 10,
    unlocked: false,
  },
  {
    id: '4',
    icon: '⚡',
    title: 'Week Warrior',
    description: 'Workout 7 Days in a Row',
    progress: 3,
    maxProgress: 10,
    unlocked: false,
  },
  {
    id: '5',
    icon: '💯',
    title: 'Century Club',
    description: 'Complete 100 workouts',
    progress: 100,
    maxProgress: 100,
    unlocked: true,
  },
  {
    id: '6',
    icon: '🏆',
    title: 'Community Leader',
    description: 'Create your first group',
    progress: 1,
    maxProgress: 1,
    unlocked: true,
  },
];

const Achievements: React.FC = ({ navigation, route }: any) => {
  const { user } = useAuth();
  const userId = route?.params?.userId || user?.id;
  const isOwnProfile = !route?.params?.userId || route?.params?.userId === user?.id;
  const handleBookSession = () => {
    navigation.navigate('ScheduledSessions');
  };

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <BasicTopBar
        onBackPress={() => navigation.goBack()}
        title={isOwnProfile ? "Achievements" : "User Achievements"}
        subtitle={isOwnProfile ? "Track your achievements" : "View user achievements"}
        containerStyle={{ paddingTop: DIMENSIONS.spacing.xxl, paddingBottom: DIMENSIONS.spacing.lg }}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.bookButton} onPress={handleBookSession}>
          <Text style={styles.bookButtonText}>Book New Session</Text>
        </TouchableOpacity>
        <View style={styles.achievementsGrid}>
          {achievements.map((achievement) => (
            <View key={achievement.id} style={styles.achievementCard}>
              {/* First row: two icons with gap */}
              <View style={styles.iconRow}>
                <Text style={styles.achievementIcon}>👟</Text>
                <View style={{ width: 16 }} />
                <Text style={styles.achievementIcon}>🏅</Text>
              </View>
              {/* Second row: name/title */}
              <Text style={styles.achievementTitle}>{achievement.title}</Text>
              {/* Third row: description */}
              <Text style={styles.achievementDescription}>{achievement.description}</Text>
              {/* Fourth row: progress bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${(achievement.progress / achievement.maxProgress) * 100}%`,
                        backgroundColor: achievement.unlocked ? COLORS.success : COLORS.primary,
                      },
                    ]}
                  />
                </View>
                {/* Progress text removed as per user request */}
              </View>
              {/* Unlocked badge removed as per user request */}
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
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: DIMENSIONS.spacing.lg,
  },
  bookButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
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
  bookButtonText: {
    color: COLORS.white,
    fontFamily: FontWeight.SemiBold,
    fontSize: 16,
    letterSpacing: 0.2,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    padding: DIMENSIONS.spacing.md,
    marginBottom: DIMENSIONS.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DIMENSIONS.spacing.sm,
    width: '100%',
  },
  achievementIcon: {
    fontSize: 32,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'left',
    alignSelf: 'stretch',
    marginBottom: DIMENSIONS.spacing.xs,
  },
  achievementDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'left',
    alignSelf: 'stretch',
    marginBottom: DIMENSIONS.spacing.sm,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: DIMENSIONS.spacing.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  unlockedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.success,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  unlockedText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default Achievements;
